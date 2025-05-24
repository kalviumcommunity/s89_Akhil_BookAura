     import React, { useState } from 'react';
     import { ReactReader } from 'react-reader';

     const Viewer = ({ epubUrl }) => {
       const [location, setLocation] = useState(0);
       

       return (
         <ReactReader
           url={epubUrl}
           location={location}
           locationChanged={setLocation}
           showToc={true}
           title="Your Book Title"
         />
       );
     };

     export default Viewer;
     