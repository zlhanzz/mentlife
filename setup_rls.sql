-- 1. Pastikan RLS diaktifkan untuk tabel ai_memory
alter table ai_memory enable row level security;

-- 2. Kebijakan untuk Read (Select): User hanya bisa melihat memori miliknya sendiri
drop policy if exists "Users can select their own ai_memory" on ai_memory;
create policy "Users can select their own ai_memory" on ai_memory
  for select
  using (auth.uid() = user_id);

-- 3. Kebijakan untuk Insert: User hanya bisa menambahkan memori miliknya sendiri
drop policy if exists "Users can insert their own ai_memory" on ai_memory;
create policy "Users can insert their own ai_memory" on ai_memory
  for insert
  with check (auth.uid() = user_id);

-- 4. Kebijakan untuk Update/Delete: User hanya bisa mengelola memorinya sendiri
drop policy if exists "Users can update their own ai_memory" on ai_memory;
create policy "Users can update their own ai_memory" on ai_memory
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own ai_memory" on ai_memory;
create policy "Users can delete their own ai_memory" on ai_memory
  for delete
  using (auth.uid() = user_id);
