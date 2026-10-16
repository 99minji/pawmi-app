# Pawmi Policy Pages

GitHub Pages용 정적 정책 사이트입니다.

## URL 구조
- `/` 정책 홈
- `/privacy/` 개인정보처리방침
- `/terms/` 이용약관
- `/account-deletion/` 계정 삭제 안내

## GitHub Pages 배포
1. GitHub에서 public repository 생성 (예: `pawmi-policy`)
2. 이 폴더의 파일 전체를 repository 루트에 업로드
3. Repository → Settings → Pages
4. Build and deployment → Source: `Deploy from a branch`
5. Branch: `main`, Folder: `/ (root)`
6. Save
7. 배포 후 `https://<github-id>.github.io/pawmi-policy/` 접속

## 출시 전 수정
- 개인정보처리방침의 국외 이전 항목을 실제 Supabase/OpenAI/Sentry 운영 환경 기준으로 확정
- 앱 내 회원 탈퇴 기능 구현
- 계정 삭제 페이지의 “제공할 예정” 문구를 현재형으로 변경
- 시행일을 실제 출시일로 변경
