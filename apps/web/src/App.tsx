import { OcrUploader } from './components/OcrUploader';

function App() {
  return (
    <div style={{ padding: '1rem', fontFamily: 'sans-serif' }}>
      <h1>OCR Web App</h1>
      <p>클라이언트 사이드 OCR (Tesseract.js + PDF.js)</p>
      <OcrUploader />
    </div>
  );
}

export default App;
