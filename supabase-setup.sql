-- AI 英语陪练大师 — Supabase 数据库初始化
-- 在 Supabase Dashboard → SQL Editor 中运行此文件

-- 启用 RLS（行级安全）
-- 用户进度表
CREATE TABLE IF NOT EXISTS user_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id       text NOT NULL,
  lesson_id       text NOT NULL,
  status          text DEFAULT 'locked' CHECK (status IN ('locked','in_progress','completed')),
  score           int,
  best_score      int,
  completed_at    timestamp,
  updated_at      timestamp DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 录音记录表
CREATE TABLE IF NOT EXISTS recordings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       text,
  audio_url       text,
  duration_sec    int,
  ai_score        int,
  ai_feedback     jsonb,
  created_at      timestamp DEFAULT now()
);

-- 对话记录表
CREATE TABLE IF NOT EXISTS conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  scene_id        text,
  messages        jsonb,
  overall_score   int,
  summary         text,
  created_at      timestamp DEFAULT now()
);

-- 词汇表
CREATE TABLE IF NOT EXISTS vocabulary (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  word            text NOT NULL,
  phonetic        text,
  translation     text,
  example_en      text,
  example_zh      text,
  source_lesson   text,
  familiarity     int DEFAULT 0 CHECK (familiarity BETWEEN 0 AND 3),
  next_review     timestamp,
  created_at      timestamp DEFAULT now()
);

-- 打卡记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date   date NOT NULL,
  study_minutes   int DEFAULT 0,
  lessons_done    int DEFAULT 0,
  created_at      timestamp DEFAULT now(),
  UNIQUE(user_id, check_in_date)
);

-- 开启 Row Level Security
ALTER TABLE user_progress  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary     ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins      ENABLE ROW LEVEL SECURITY;

-- 每张表只允许用户访问自己的数据
CREATE POLICY "user_progress_own" ON user_progress  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "recordings_own"    ON recordings      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "conversations_own" ON conversations   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "vocabulary_own"    ON vocabulary      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "check_ins_own"     ON check_ins       FOR ALL USING (auth.uid() = user_id);

-- 创建录音文件 Storage Bucket（在 Supabase Dashboard → Storage 中手动创建名为 recordings 的 bucket）
-- 或运行：
-- INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);
