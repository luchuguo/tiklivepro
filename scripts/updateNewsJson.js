import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateNewsJson() {
  console.log('Fetching news articles from Supabase...');
  const { data, error } = await supabase.from('news_articles').select('*');
  if (error) {
    console.error('Error fetching news articles:', error);
    return;
  }
  const jsonData = JSON.stringify(data, null, 2);
  const outputPath = path.join(process.cwd(), 'src/data/news.json');
  fs.writeFileSync(outputPath, jsonData);
  console.log(`Updated news.json with ${data.length} articles at ${outputPath}`);
}

updateNewsJson(); 