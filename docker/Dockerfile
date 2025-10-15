# Stage 1: Build Docusaurus static site

FROM node:20-alpine AS builder
WORKDIR /app
# Copy package files from src
COPY ../src/package.json ../src/yarn.lock* ../src/package-lock.json* ./
# Cài đặt dependencies
RUN npm ci
RUN npm install @docusaurus/theme-live-codeblock --save-exact
RUN npm install remark-math rehype-katex katex
# Copy toàn bộ mã nguồn từ src
COPY ../src .
# Tạo search index
RUN node scripts/create-search-index.js
# Build Docusaurus
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]