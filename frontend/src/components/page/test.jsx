import React, { useState } from "react";
import { TagInput } from "emblor";

function Example() {
  const [exampleTags, setExampleTags] = useState([]);
  const [activeTagIndex, setActiveTagIndex] = useState(null);

  return (
    <>
      <div>
        <span className="inline-flex pl-2">aaaaa</span>
      </div>
      <TagInput
        tags={exampleTags}
        setTags={(newTags) => {
          setExampleTags(newTags);
        }}
        placeholder="Add a tag"
        styleClasses={{}}
        activeTagIndex={activeTagIndex}
        setActiveTagIndex={setActiveTagIndex}
      />
    </>
  );
}

export default Example;
