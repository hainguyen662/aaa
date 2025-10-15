# DevSecOps_proj

Một ví dụ DevSecOps + GitOps tối giản: build & tag Docker image theo commit, cập nhật Helm chart tách riêng, ArgoCD tự sync triển khai lên Kubernetes.

## 1. Kiến trúc tổng quan
```text
Dev (git push) --> GitLab CI
	1. Build image (tag = commit SHA)
	2. Cập nhật helm-charts/values.yaml (image.tag)
	3. Commit & push repo helm-charts
ArgoCD (watch helm-charts) --> Sync --> Deploy lên cluster
```

Thành phần:
- Repo code (repo này) chứa Dockerfile & logic ứng dụng.
- Repo Helm chart (helm-charts) được pipeline cập nhật tag tự động.
- ArgoCD Application trỏ vào repo Helm chart (path root) ở branch `main`.
- GitLab Runner (docker, privileged) dùng Docker‑in‑Docker.

## 2. Cấu trúc thư mục chính
| Thư mục / File | Mô tả |
|----------------|-------|
| `.gitlab-ci.yml` | Pipeline build & GitOps sync (cập nhật helm values) |
| `docker/` | Dockerfile và config phục vụ build image |
| `charts/` | (Tùy chọn) Helm chart nội bộ khi chưa tách repo |
| `src/` | Source code / nội dung ứng dụng |
| `argocd-app.yaml` | Định nghĩa ArgoCD Application (trỏ sang repo Helm) |
| `coomand.md` | Ghi chú chi tiết quá trình, đã được sanitize |

## 3. Luồng CI/CD hiện tại
1. Job `build_and_push` chạy trên branch `main`.
2. Đăng nhập Docker registry bằng biến CI.
3. Clone repo Helm bằng PAT (`GITLAB_TOKEN`) qua HTTPS (fallback http nếu cần, có xoá thư mục trước khi retry).
4. Sử dụng `sed` cập nhật trường `tag:` trong `values.yaml`.
5. Tạo branch mới, commit thay đổi `values.yaml` và mở Merge Request (MR) sang `main` repo Helm (khuyến nghị, bảo mật & kiểm soát tốt hơn).
6. (Tùy chọn: Nếu chưa dùng MR, có thể commit & push thẳng `main` repo Helm như cũ).
7. Build & push image `DOCKERHUB_REPO:IMAGE_TAG`.
8. Sau khi MR được merge, ArgoCD phát hiện commit mới -> rollout.

## 4. Biến CI/CD
| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| DOCKERHUB_USER | Yes | Docker Hub / registry user |
| DOCKERHUB_PASSWORD | Yes | Password / Access token registry |
| DOCKERHUB_REPO | Yes | Ví dụ: user/devsecops-proj |
| GITLAB_TOKEN | Yes | PAT scopes: read_repository + write_repository (repo helm-charts) |
| GITLAB_HOST | No | Mặc định nội bộ `192.168.1.189` |
| GITLAB_PROTOCOL | No | `https` (fallback http) |
| HELM_REPO_PATH | No | `devops/helm-charts.git` |

## 5. Local development
### 5.1 Build / test ứng dụng
```sh
cd src
yarn install # hoặc npm install
yarn build   # hoặc npm run build
cd ..
docker build -t devsecops-proj:local -f docker/Dockerfile .
```

### 5.2 Chạy container
```sh
docker run -p 8080:80 devsecops-proj:local
```

### 5.3 Helm (nếu dùng chart nội bộ)
```sh
helm upgrade --install devsecops-proj ./charts -f charts/values.yaml \
	--set image.repository=$DOCKERHUB_REPO \
	--set image.tag=local
```

## 6. ArgoCD
`argocd-app.yaml` ví dụ (rút gọn):
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
	name: devsecops-proj
	namespace: argocd
spec:
	source:
		repoURL: http://192.168.1.189/devops/helm-charts.git
		targetRevision: main
		path: .
		helm:
			releaseName: devsecops-proj
	destination:
		server: https://kubernetes.default.svc
		namespace: default
	syncPolicy:
		automated:
			prune: true
			selfHeal: true
		syncOptions:
			- CreateNamespace=true
```
Apply:
```sh
kubectl apply -f argocd-app.yaml -n argocd
```

## 7. Troubleshooting nhanh
| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|-------------|------------------------|------------|
| Job pending | Runner không privileged / tag mismatch | Kiểm tra `config.toml`, tags |
| Clone helm-charts fail 302 | Redirect HTTPS / thiếu quyền PAT | Force https, kiểm tra scopes |
| Fallback http vẫn lỗi | Thư mục còn sót | Đã thêm `rm -rf`, xem log cảnh báo |
| Image không rollout | ArgoCD trỏ sai repo / sync tắt | Kiểm tra Application & sync status |
| values.yaml không đổi | sed không match | Kiểm tra indent dòng `tag:` (2 spaces) |

## 8. Bảo mật & Thực hành tốt
- Không commit secrets: dùng CI/CD Variables / SealedSecret.
- Rotate PAT 60–90 ngày, xoá SSH key đã lộ.
- Bỏ `GIT_SSL_NO_VERIFY` sau khi có TLS hợp lệ.
- (Future) Thêm Trivy, SBOM, ký image (cosign), policy admission.

## 9. Kế hoạch mở rộng
| Hạng mục | Mục tiêu |
|----------|----------|
| Auto Merge Request | Đã bổ sung: Pipeline tạo branch, commit thay đổi values.yaml và mở MR tự động sang main repo Helm. MR cần được review/merge thủ công hoặc tự động (API) để ArgoCD rollout. |
| Chart version bump | Tự động tăng Chart.yaml version |
| Security scanning | Trivy + license check |
| Smoke test | Kiểm tra health endpoint sau rollout |
| Multi-env | Tách values-staging.yaml / prod |

## 10. Quy trình chuẩn hiện nay (Runbook)
1. Dev push code branch main.
2. Pipeline build image + update Helm repo.
3. ArgoCD sync & rollout.
4. Kiểm tra:
	 ```sh
	 kubectl get deploy devsecops-proj -o jsonpath='{.spec.template.spec.containers[0].image}'
	 ```
5. Rollback: sửa tag cũ trong repo helm-charts và commit.

## 11. Ghi chú khác
- File `coomand.md` chứa log lịch sử đã được sanitize (không dùng secrets thật).
- Có thể chuyển sang sử dụng DNS nội bộ thay vì IP để tiện TLS.

### Tham khảo Auto Merge Request (GitLab API)
Ví dụ đoạn script tạo MR tự động trong pipeline:
```sh
# Giả sử đã commit lên branch mới $BRANCH_NAME
curl --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
	--data "source_branch=$BRANCH_NAME&target_branch=main&title=Update+image+tag+to+$IMAGE_TAG" \
	"https://$GITLAB_HOST/api/v4/projects/<project_id>/merge_requests"
```
Tham số `<project_id>` lấy từ GitLab UI hoặc API. Có thể bổ sung auto-merge nếu pass CI:
https://docs.gitlab.com/ee/api/merge_requests.html#accept-mr
- File `coomand.md` chứa log lịch sử đã được sanitize (không dùng secrets thật).
- Có thể chuyển sang sử dụng DNS nội bộ thay vì IP để tiện TLS.

---
© 2025 DevSecOps_proj – GitOps & CI/CD demo.
AWS_SECRET_ACCESS_KEY = "AKIA1234567890FAKESECRET"
