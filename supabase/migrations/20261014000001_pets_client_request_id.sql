-- 온보딩 한 번당 펫 하나만 생성되도록 요청 식별자를 저장한다.
-- 사용자당 여러 펫을 허용해야 하므로 user_id에는 unique 제약을 두지 않는다.
alter table public.pets
  add column if not exists client_request_id uuid;

create unique index if not exists pets_client_request_id_unique
  on public.pets (user_id, client_request_id)
  where client_request_id is not null;
