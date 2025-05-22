import { useState, useEffect } from "react";

export default function BookViewer({ files }) {
  const [toc, setToc] = useState([]);
  const [current, setCurrent] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    const tocRaw = files["toc.json"];
    if (tocRaw) {
      const tocData = JSON.parse(tocRaw);
      setToc(tocData);
      if (tocData.length > 0) setCurrent(tocData[0].file);
    }
  }, [files]);

  useEffect(() => {
    if (current && files[current]) {
      setContent(files[current]);
    }
  }, [current, files]);

  return (
    <div className="flex">
      <aside className="w-1/4 p-4 border-r">
        <h2 className="font-bold mb-2">Chapters</h2>
        <ul>
          {toc.map((ch, idx) => (
            <li
              key={idx}
              className="cursor-pointer hover:underline"
              onClick={() => setCurrent(ch.file)}
            >
              {ch.title}
            </li>
          ))}
        </ul>
      </aside>
      <main className="w-3/4 p-4">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </main>
    </div>
  );
}
