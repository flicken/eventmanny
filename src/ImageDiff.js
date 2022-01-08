import React from "react";

import { useState, useRef, useEffect } from "react";

import beforeImage from "./before.png";
import afterImage from "./after.png";

import diff from "diff-sequences";
import isEqual from "lodash.isequal";

import PanZoom from "react-easy-panzoom";
import panzoom from "panzoom";

function imageTo2DArray({ data, width, height }, padToWidth) {
  const padding = padToWidth - width;
  // The imageData is a 1D array. Each element in the array corresponds to a
  // decimal value that represents one of the RGBA channels for that pixel.
  const rowSize = width * 4;

  const newData = [];
  for (let row = 0; row < height; row += 1) {
    const pixelsInRow = new Uint8ClampedArray(rowSize + padding * 4);
    for (let location = 0; location < rowSize; location += 1) {
      pixelsInRow[location] = data[row * rowSize + location];
    }
    newData.push(pixelsInRow);
  }
  return newData;
}

// Given zero-based half-open range [start, end) of array indexes,
// return one-based closed range [start + 1, end] as string.
const getRange = (start, end) =>
  start + 1 === end ? `${start + 1}` : `${start + 1},${end}`;

const GREEN = [106, 133, 0, 255 * 0.2];
const RED = [255, 0, 0, 255 * 0.2];
const MAGENTA = [197, 39, 114, 255 * 0.2];

// Given index intervals of lines to delete or insert, or both, or neither,
// push formatted diff lines onto array.
const pushDelIns = (
  nCommon,
  aLines,
  aIndex,
  aEnd,
  bLines,
  bIndex,
  bEnd,
  array,
  diffDirection
) => {
  const deleteLines = aIndex !== aEnd;
  const insertLines = bIndex !== bEnd;
  const changeLines = deleteLines && insertLines;

  // if (changeLines) {

  //   array.push(getRange(aIndex, aEnd) + "c" + getRange(bIndex, bEnd));
  // } else

  if (deleteLines) {
    // array.push(getRange(aIndex, aEnd) + "d" + String(bIndex));
    for (; aIndex !== aEnd; aIndex += 1) {
      array.push(aLines[aIndex]); // delete
      diffDirection.push("red");
    }
  }
  if (insertLines) {
    // array.push(String(aIndex) + "a" + getRange(bIndex, bEnd));
    for (; bIndex !== bEnd; bIndex += 1) {
      array.push(bLines[bIndex]); // insert
      diffDirection.push("green");
    }
  }

  for (var i = 0; i < nCommon; i++) {
    array.push(aLines[aEnd + i]); // same
    diffDirection.push("transparent");
  }

  // if (changeLines) {
  //   array.push("---");
  // }
};

// Given content of two files, return emulated output of diff utility.
const findDiff = (aCanvas, bCanvas, hashFunction = btoa) => {
  const aImage = getCanvasImageData(aCanvas);
  const bImage = getCanvasImageData(bCanvas);
  const maxWidth = Math.max(aImage.width, bImage.width);

  const aImageData = imageTo2DArray(aImage, maxWidth);
  const bImageData = imageTo2DArray(bImage, maxWidth);

  const aLines = aImageData;
  const bLines = bImageData;

  const aLength = aLines.length;
  const bLength = bLines.length;

  let aIndex = 0;
  let bIndex = 0;
  const array = [];
  const diffDirection = [];
  const foundSubsequence = (nCommon, aCommon, bCommon) => {
    pushDelIns(
      nCommon,
      aLines,
      aIndex,
      aCommon,
      bLines,
      bIndex,
      bCommon,
      array,
      diffDirection
    );
    aIndex = aCommon + nCommon; // number of lines compared in a
    bIndex = bCommon + nCommon; // number of lines compared in b
  };

  const isCommon = (aIndex, bIndex) => {
    return isEqual(aLines[aIndex], bLines[bIndex]);
  };

  diff(aLength, bLength, isCommon, foundSubsequence);

  // After the last common subsequence, push remaining change lines.
  pushDelIns(
    0,
    aLines,
    aIndex,
    aLength,
    bLines,
    bIndex,
    bLength,
    array,
    diffDirection
  );

  const data = new Uint8ClampedArray(maxWidth * array.length * 4);

  // flatten array
  for (var i = 0; i < array.length; i++) {
    data.set(array[i], i * maxWidth * 4);
  }

  return {
    data: data,
    height: array.length,
    width: maxWidth,
    diffDirection: diffDirection,
  };
};

function drawUriImageOnCanvas(uri, canvas) {
  return new Promise(function (resolve, reject) {
    if (uri == null) return reject();
    const context = canvas.getContext("2d");
    const image = new Image();
    image.addEventListener(
      "load",
      function () {
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.parentElement.width = image.width;
        canvas.parentElement.height = image.height;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      },
      false
    );
    image.src = uri;
  });
}

function getCanvasImageData(canvas) {
  const context = canvas.getContext("2d");
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

function ImageDiff(props, state) {
  const [count, setCount] = useState(null);
  const [diffImage, setDiffImage] = useState(null);
  const [diffColorImage, setDiffColorImage] = useState(null);
  const canvasRef = useRef(null);
  const image1Ref = useRef(null);
  const image2Ref = useRef(null);

  useEffect(() => {
    (async function () {
      await drawUriImageOnCanvas(beforeImage, image1Ref.current);

      setCount((prevCount) => prevCount + 1);
    })();
  }, [image1Ref]);

  useEffect(() => {
    (async function () {
      await drawUriImageOnCanvas(afterImage, image2Ref.current);

      setCount((prevCount) => prevCount + 1);
    })();
  }, [image2Ref]);

  useEffect(() => {
    if (count >= 2 && image1Ref.current && image2Ref.current) {
      const result = findDiff(image1Ref.current, image2Ref.current);

      const diffImage = new ImageData(result.data, result.width, result.height);

      const c = document.createElement("canvas");
      const cctx = c.getContext("2d");
      c.width = result.width;
      c.height = result.height;
      for (var i = 0; i < result.diffDirection.length; i++) {
        cctx.fillStyle = result.diffDirection[i];
        cctx.fillRect(0, i, result.width, 1);
      }

      setDiffColorImage(c);
      setDiffImage(diffImage);
    }
  }, [count, image1Ref, image2Ref]);

  useEffect(() => {
    if (canvasRef.current) {
      console.log("Canvas");
      console.log(typeof canvasRef.current);
      // panzoom(canvasRef.current, {
      //   bounds: true,
      //   boundsPadding: 0.1,
      // });
    }
  }, [canvasRef]);

  useEffect(() => {
    if (canvasRef.current && diffImage && diffColorImage) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      context.putImageData(diffImage, 0, 0);

      // set compositing to color (changes hue with new overwriting colors)
      context.globalCompositeOperation = "multiply";

      // draw the diff coloring img on top
      context.drawImage(diffColorImage, 0, 0);

      // change compositing back to default
      context.globalCompositeOperation = "source-over";
    }
  }, [diffImage, diffColorImage, canvasRef]);

  // preventPan gives access to the event, as well as the
  // mouse coordinates in the coordinate system of the PanZoom container
  const preventPan = (e, x, y) => {
    // if the target is the content container then prevent panning
    if (e.target === canvasRef.current) {
      return true;
    }

    // in the case he target is not the content container
    // use the coordinates to determine if the click happened
    // on the content container
    const contentRect = canvasRef.current.getBoundingClientRect();

    const x1 = contentRect.left;
    const x2 = contentRect.right;
    const y1 = contentRect.top;
    const y2 = contentRect.bottom;

    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  };

  return (
    <div>
      <div width="600">
        {/* <PanZoom
          preventPan={preventPan}
          boundaryRatioVertical={0.8}
          boundaryRatioHorizontal={0.8}
          enableBoundingBox
        > */}
        <canvas
          ref={canvasRef}
          height={diffImage ? diffImage.height : 2000}
          width={diffImage ? diffImage.width : 2000}
        />
        {/* </PanZoom> */}
      </div>
      <canvas ref={image1Ref} />
      <canvas ref={image2Ref} />
    </div>
  );
}

export default ImageDiff;
