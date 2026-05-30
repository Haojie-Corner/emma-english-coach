#!/bin/bash
# 一键部署三个 Supabase Edge Functions 并设置 API Key 密钥
# 运行前确保已安装 Supabase CLI：npm install -g supabase
# 然后执行：bash scripts/deploy-functions.sh

set -e

PROJECT_REF="fjyurnpxvstiwxjqrcog"

echo "🔗 链接 Supabase 项目..."
supabase link --project-ref $PROJECT_REF

echo ""
echo "🔑 设置 API Key 密钥（从 .env.local 读取）..."

# 读取 .env.local
if [ -f ".env.local" ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

supabase secrets set GEMINI_API_KEY="$VITE_GEMINI_API_KEY"
supabase secrets set ELEVENLABS_API_KEY="$VITE_ELEVENLABS_API_KEY"
supabase secrets set DEEPSEEK_API_KEY="$VITE_DEEPSEEK_API_KEY"

echo ""
echo "🚀 部署 Edge Functions..."
supabase functions deploy gemini-proxy   --no-verify-jwt
supabase functions deploy tts-proxy      --no-verify-jwt
supabase functions deploy deepseek-proxy --no-verify-jwt

echo ""
echo "✅ 全部部署完成！API Key 现在安全存储在服务端，不再暴露给浏览器。"
echo ""
echo "⚠️  部署后可以从 .env.local 中删除以下三行（保留 Supabase 的两行）："
echo "    VITE_GEMINI_API_KEY"
echo "    VITE_ELEVENLABS_API_KEY"
echo "    VITE_DEEPSEEK_API_KEY"
