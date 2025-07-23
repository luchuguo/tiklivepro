import React, { useState } from 'react';

const apiKey = import.meta.env.VITE_DEBLUR_API_KEY; // 读取.env变量

export default function MagicApiImageUpload() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) {
      setError('请选择图片文件');
      return;
    }
    setLoading(true);
    setError('');
    setUrl('');
    try {
      const formData = new FormData();
      formData.append('filename', file);

      const res = await fetch('https://prod.api.market/api/v1/magicapi/image-upload/upload', {
        method: 'POST',
        headers: {
          'x-magicapi-key': apiKey,
          // 'Content-Type' 不要手动设置，fetch会自动处理
          'accept': 'application/json',
        },
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setUrl(data.url);
      } else if (data.data && data.data.url) {
        setUrl(data.data.url);
      } else {
        setError(data.message || '上传失败');
      }
    } catch (e) {
      setError(e.message || '上传异常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #eee', padding: 16, margin: 16 }}>
      <h3>MagicAPI 图片上传测试</h3>
      <input
        type="file"
        accept="image/*"
        onChange={e => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload} disabled={loading} style={{ marginLeft: 8 }}>
        {loading ? '上传中...' : '上传到MagicAPI'}
      </button>
      {url && (
        <div>
          <p>图片地址：</p>
          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
          <br />
          <img src={url} alt="上传结果" style={{ maxWidth: 200, marginTop: 8 }} />
        </div>
      )}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}