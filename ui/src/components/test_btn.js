export default function TestDownloadButton({ buttonText }) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/${buttonText}`;
    link.download = buttonText;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button onClick={handleDownload} className="test-btn">
      {buttonText || "Download File"}
    </button>
  );
}
