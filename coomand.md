---
## Hướng dẫn tạo runner quyền cao nhất (privileged)

1. Xóa hết các runner cũ trong `/etc/gitlab-runner/config.toml`, chỉ giữ lại 1 block như sau:

```
concurrent = 1
check_interval = 0
shutdown_timeout = 0

[session_server]
	session_timeout = 1800

[[runners]]
	name = "docker"
	url = "http://localhost"
	token = "<TOKEN>"
	executor = "docker"
	[runners.docker]
		tls_verify = false
		image = "docker:24.0.5"
		privileged = true
		disable_entrypoint_overwrite = false
		oom_kill_disable = false
		disable_cache = false
		volumes = ["/cache","/var/run/docker.sock:/var/run/docker.sock"]
		shm_size = 0
		network_mtu = 0
	[runners.cache]
		MaxUploadedArchiveSize = 0
		[runners.cache.s3]
		[runners.cache.gcs]
		[runners.cache.azure]
```

2. Sửa xong, lưu lại và restart runner:
```bash
sudo systemctl restart gitlab-runner
```

3. Tạo lại pipeline mới hoặc retry job.

**Lưu ý:**
- Thay `<TOKEN>` bằng token thực tế của bạn.
- Đảm bảo chỉ có 1 block `[[runners]]` executor = "docker" và `privileged = true`.
- Nếu vẫn pending, kiểm tra log runner bằng:
```bash
sudo journalctl -u gitlab-runner -f
```
và gửi log để mình hỗ trợ tiếp.
http://192.168.0.103

http://localhost

(base)  🐍 base  hainguyen@devops  ~/MASTER  sudo gitlab-rails console
--------------------------------------------------------------------------------
 Ruby:         ruby 3.2.8 (2025-03-26 revision 13f495dc2c) [x86_64-linux]
 GitLab:       18.4.1 (e88a8d1d1c2) FOSS
 GitLab Shell: 14.45.2
 PostgreSQL:   16.10
------------------------------------------------------------[ booted in 16.64s ]
Loading production environment (Rails 7.1.5.2)
irb(main):001> 
irb(main):002> user = User.where(id: 1).first
irb(main):003> user.password = 'matkhau_moi'
irb(main):004> user.password_confirmation = 'matkhau_moi'
irb(main):005> user.save!
=> true
irb(main):006> 


root
<REDACTED_ROOT_PASSWORD>

---
## DevSecOps_proj – Ghi chú triển khai GitLab & CI/CD

### 1. Mục tiêu ban đầu
Triển khai GitLab self‑host, cấu hình pipeline CI/CD build – push Docker image lên Docker Hub và (tùy chọn) deploy Helm. Giảm sự cố Pending do runner, chuẩn hóa biến môi trường.

### 2. Timeline tóm tắt
| Thời điểm | Hành động chính | Kết quả / Sự cố |
|----------|-----------------|-----------------|
| B1 | Cài GitLab Omnibus, đặt `external_url` ban đầu = IP `http://192.168.111.181` | Truy cập được bằng IP |
| B2 | Đổi ý muốn dùng `localhost`, điều chỉnh `external_url` | Cần `gitlab-ctl reconfigure` |
| B3 | Tạo project `DevSecOps_proj`, push code | OK |
| B4 | Tạo pipeline đầu tiên `.gitlab-ci.yml` (build, push, deploy) | Pipeline Pending – chưa có runner |
| B5 | Đăng ký runner user-mode (không sudo) | Runner xuất hiện nhưng service system-mode không dùng được |
| B6 | Thêm tags `docker` vào job nhưng pipeline vẫn Pending | Vì system-mode không có runner cấu hình |
| B7 | Kiểm tra `/etc/gitlab-runner/config.toml` -> rỗng | Xác định nguyên nhân chính |
| B8 | Cài Docker (trước đó chưa có) | Runner vẫn Pending do version mismatch |
| B9 | Thử chạy job -> lỗi API version (client 1.18 quá cũ) | Runner version quá cũ (11.2.0) |
| B10 | Kế hoạch: Nâng cấp GitLab Runner lên bản mới + privileged | Chuẩn bị thực thi |

### 3. Cài đặt GitLab (Omnibus – tóm tắt)
1. Cài gói Omnibus (không ghi chi tiết ở đây).  
2. Sửa `/etc/gitlab/gitlab.rb`:  
	 `external_url 'http://192.168.111.181'` hoặc `http://localhost`.  
3. Áp dụng: `sudo gitlab-ctl reconfigure`.
4. Đổi mật khẩu root qua Rails console (đã thực hiện – xem log bên trên).

### 4. Tạo dự án & pipeline cơ bản
File `.gitlab-ci.yml` ban đầu gồm các stage: security, build, push, deploy. Sau đó đã:
- Loại bỏ security để đơn giản hóa (debug runner).
- Thêm tags `docker` cho các job.
- Thêm rule manual/variable cho deploy.

### 5. Các sự cố chính & Cách khắc phục
#### 5.1 Pipeline Pending vô thời hạn
Nguyên nhân: Service system-mode không có runner (`/etc/gitlab-runner/config.toml` rỗng) trong khi runner đăng ký ở user-mode (`~/.gitlab-runner/config.toml`).
Khắc phục: Copy block `[[runners]]` sang file system-mode hoặc re-register bằng `sudo gitlab-runner register`.

#### 5.2 `client version 1.18 is too old (min 1.24)`
Nguyên nhân: GitLab Runner 11.2.0 quá cũ so với Docker 24.
Khắc phục: Gỡ cài runner cũ, cài lại bản mới từ repo chính thức `packages.gitlab.com`, kiểm tra `gitlab-runner --version` >= 16.x.

#### 5.3 `privileged` thiếu khi dùng docker:dind
Triệu chứng: Job mãi Pending hoặc fail Preparation khi cố tạo service dind.
Giải pháp: Trong `[runners.docker]` thêm `privileged = true` hoặc bỏ hẳn dind và mount socket host.

### 6. Cấu hình runner đề xuất (system-mode)
```
concurrent = 1
check_interval = 0

[[runners]]
	name = "devops"
	url = "http://localhost"
	token = "<token>"
	executor = "docker"
	[runners.docker]
		image = "docker:24.0.5"
		privileged = true
		volumes = ["/cache","/var/run/docker.sock:/var/run/docker.sock"]
```

### 7. `.gitlab-ci.yml` tối giản sau khi bỏ dind
```
stages: [build, push, deploy]

variables:
	DOCKER_IMAGE: "$DOCKERHUB_REPO:$CI_COMMIT_REF_SLUG"

build_image:
	stage: build
	image: docker:24.0.5
	script:
		- echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USER" --password-stdin
		- docker build -t $DOCKER_IMAGE -f docker/Dockerfile .
	only: [main]
	tags: [docker]

push_image:
	stage: push
	image: docker:24.0.5
	script:
		- echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USER" --password-stdin
		- docker push $DOCKER_IMAGE
	only: [main]
	tags: [docker]

deploy:
	stage: deploy
	image: alpine/helm:3.12.0
	script:
		- helm upgrade --install devsecops-proj ./charts -f charts/values.yaml --set image.repository=$DOCKERHUB_REPO --set image.tag=$CI_COMMIT_REF_SLUG
	rules:
		- if: '$deploy == "prod"'
			when: always
		- if: '$CI_PIPELINE_SOURCE == "web" && $CI_COMMIT_REF_NAME == "main"'
			when: manual
	tags: [docker]
```

### 8. Biến môi trường sử dụng
| Key | Mục đích |
|-----|----------|
| DOCKERHUB_USER | Username Docker Hub |
| DOCKERHUB_PASSWORD | Password / token Docker Hub |
| DOCKERHUB_REPO | Repo (vd: `bravelove123/devsecops_proj`) |
| deploy | Nếu = prod thì deploy job auto chạy |
| DEPLOY_PROD (cũ) | Biến thử nghiệm, có thể bỏ |

### 9. Checklist kiểm tra sau fix
1. `gitlab-runner --version` >= 16.x.  
2. `/etc/gitlab-runner/config.toml` có `[[runners]]`.  
3. Log runner: có dòng `Checking for jobs... received job`.  
4. Pipeline mới: build_image chuyển Running trong < 5s.  
5. Image push lên Docker Hub tag = slug branch.  
6. Deploy manual chạy thành công (Helm release tồn tại).  

### 10. Khuyến nghị tiếp theo
- Thêm lại security (Trivy + npm audit) sau khi runner ổn định.
- Tạo môi trường staging riêng với values-stag.yaml.
- Thêm caching layer (npm cache, docker buildx) để giảm thời gian build.
- Ký image (cosign) và policy kiểm tra signature trước deploy (mở rộng tương lai).

### 11. Lỗi thường gặp nhanh
| Lỗi | Nguyên nhân | Fix ngắn |
|-----|-------------|----------|
| Pending mãi | Runner system không có cấu hình | Copy/đăng ký lại runner |
| API version too old | Runner version cổ | Nâng cấp runner |
| Dind fail / permission | Thiếu privileged | privileged=true hoặc bỏ dind |
| Cannot force push main | Branch protected | Unprotect tạm / bỏ force push |
| Không deploy prod | Thiếu biến `deploy=prod` | Set variable khi run pipeline |

---
End of report.

gitlab-runner register  --url http://localhost  --token <REDACTED_RUNNER_TOKEN>

sudo gitlab-ctl reconfigure
sudo gitlab-ctl restart



token:
<REDACTED_GITLAB_PAT>


sudo docker run -d --privileged --restart=unless-stopped \
  -p 8081:80 -p 8443:443 -p 6444:6444 \
  --name rancher \
  rancher/rancher:latest


Bootstrap Password: <REDACTED_RANCHER_BOOTSTRAP>

https://localhost:8443

server: https://172.17.0.2:6444


argocd:

kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
admin

<REDACTED_ARGOCD_ADMIN_PASSWORD>


khoidong gitlab:

sudo nano /etc/gitlab/gitlab.rb
git remote set-url origin http://192.168.111.110/devops/devsecops_proj.git
git remote set-url origin git@192.168.111.110:devops/devsecops_proj.git




---
## Tổng hợp thay đổi Pipeline & GitOps (SANITIZED)

### Mục tiêu đạt được
1. Build & push Docker image với tag = commit short SHA.
2. Đồng bộ tag vào repo Helm (values.yaml) bằng PAT (thay SSH key đã lộ).
3. ArgoCD Application trỏ sang repo helm-charts (GitOps pull model).
4. Gom về một job duy nhất tránh artifact trung gian.
5. Thêm fallback clone (https -> http) + xoá thư mục trước khi retry.
6. Gỡ toàn bộ secrets đã ghi rõ trong tài liệu cũ, thay placeholder.

### Vấn đề chính & Giải pháp
| Vấn đề | Triệu chứng | Giải pháp |
|--------|-------------|-----------|
| Runner pending | Job không start | Re-register system runner + privileged |
| Docker API mismatch | client version too old | Nâng cấp runner + docker:24.0.5 |
| YAML lỗi | Parser error script array | Dùng single multiline block |
| Không cập nhật Helm | values.yaml không đổi | sed + commit + push vào helm-charts |
| SSH auth fail / key lộ | Host key verify failed | Chuyển sang PAT HTTPS |
| 302 redirect HTTP | Clone fail | Force https, fallback http nếu cần |
| Fallback clone bị kẹt | Thư mục còn tồn tại | rm -rf trước clone lại |
| ArgoCD không rollout | Repo trỏ sai | Sửa repoURL sang helm-charts |

### `.gitlab-ci.yml` cuối cùng (rút gọn & ẩn biến)
```yaml
stages: [build]
variables:
	IMAGE_TAG: "$CI_COMMIT_SHORT_SHA"
build_and_push:
	stage: build
	image: docker:24.0.5
	services: ["docker:24.0.5-dind"]
	script:
		- |
			set -e
			echo "[INFO] Login Docker registry"
			echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USER" --password-stdin
			apk add --no-cache git curl
			if [ -z "$GITLAB_TOKEN" ]; then echo "[ERROR] Missing GITLAB_TOKEN" >&2; exit 1; fi
			: "${GITLAB_HOST:=192.168.1.189}"
			: "${GITLAB_PROTOCOL:=https}"
			: "${HELM_REPO_PATH:=devops/helm-charts.git}"
			export GIT_SSL_NO_VERIFY=1
			echo "[INFO] Image tag: $IMAGE_TAG"
			HELM_REPO_CLONE_URL="${GITLAB_PROTOCOL}://oauth2:${GITLAB_TOKEN}@${GITLAB_HOST}/${HELM_REPO_PATH}"
			if ! git clone --depth 1 "$HELM_REPO_CLONE_URL" ../helm-charts 2>/dev/null; then
				echo "[WARN] Clone failed over $GITLAB_PROTOCOL" >&2
				if [ "$GITLAB_PROTOCOL" = "https" ]; then
					echo "[INFO] Fallback to http" >&2
					rm -rf ../helm-charts
					GITLAB_PROTOCOL="http"
					HELM_REPO_CLONE_URL="${GITLAB_PROTOCOL}://oauth2:${GITLAB_TOKEN}@$GITLAB_HOST/$HELM_REPO_PATH"
					git clone --depth 1 "$HELM_REPO_CLONE_URL" ../helm-charts || { echo "[ERROR] Clone failed fallback" >&2; exit 1; }
				else
					echo "[ERROR] Clone failed over http" >&2; exit 1
				fi
			fi
			sed -i -E "s|^(  tag:).*|  tag: $IMAGE_TAG|" ../helm-charts/values.yaml
			cd ../helm-charts
			git config user.email "ci-bot@example"
			git config user.name "CI Bot"
			git add values.yaml
			git commit -m "ci: update values tag $IMAGE_TAG" || echo "No changes to commit"
			git push origin HEAD:main || echo "No changes to push"
			cd -
			docker build -t "$DOCKERHUB_REPO:$IMAGE_TAG" -f docker/Dockerfile .
			docker push "$DOCKERHUB_REPO:$IMAGE_TAG"
	only: [main]
	tags: [docker]
```

### Biến CI/CD bắt buộc
| Biến | Ghi chú |
|------|---------|
| DOCKERHUB_USER | Tài khoản Docker Hub |
| DOCKERHUB_PASSWORD | Token/password Docker Hub |
| DOCKERHUB_REPO | repo image (vd user/app) |
| GITLAB_TOKEN | PAT read+write repo helm-charts |

### Biến tuỳ chọn
| Biến | Default | Mục đích |
|------|---------|----------|
| GITLAB_HOST | 192.168.1.189 | Host GitLab nội bộ |
| GITLAB_PROTOCOL | https | Giao thức clone |
| HELM_REPO_PATH | devops/helm-charts.git | Đường dẫn project helm |

### ArgoCD Application (sanitized)
```yaml
source:
	repoURL: 'http://192.168.1.189/devops/helm-charts.git'
	targetRevision: main
	path: .
```
 
### Runbook nhanh
1. Push code -> pipeline build + update values.
2. ArgoCD sync (auto) rollout.
3. Kiểm tra: `kubectl get deploy -o yaml | grep image:`.
4. Rollback: sửa values.yaml tag cũ -> commit.

### Bảo mật
- ĐÃ THAY thế toàn bộ password/token bằng placeholder.
- Rotate PAT & ArgoCD admin password định kỳ.
- Gỡ SSH key cũ nếu còn cấu hình.

### Next Steps
1. Auto Merge Request thay vì push main.
2. Bump Chart.yaml version tự động.
3. Thêm security scan (Trivy) & SBOM.
4. Bỏ `GIT_SSL_NO_VERIFY` khi có chứng chỉ hợp lệ.
5. Thêm smoke test sau deploy.
---
End of sanitized summary.

AWS_SECRET_ACCESS_KEY = "AKIA1234567890FAKESECRET"