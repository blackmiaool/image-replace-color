function preloadImage(src) {
    const dom = document.createElement("img");

    if (dom.naturalWidth) {
        return Promise.resolve(dom);
    }
    dom.setAttribute("src", src);
    dom.setAttribute(
        "style",
        "opacity:0.01;position:fixed;bottom:0;left:0;height:1px;width:1px;z-index:10000;pointer-events:none;"
    );

    document.body.appendChild(dom);
    return new Promise(resolve => {
        dom.addEventListener("load", () => {
            document.body.removeChild(dom);
            resolve(dom);
        });
    });
}

export default function replace(src, colorMaps) {
    src = src.replace(/^(https?:)?\/\/[^/:]+/, `//${location.host}`);
    return preloadImage(src).then(img => {
        const canvas = document.createElement("canvas");
        canvas.setAttribute("height", img.naturalHeight);
        canvas.setAttribute("width", img.naturalWidth);
        canvas.setAttribute(
            "style",
            "position:fixed;top:0;left:0;z-index:111;opacity:0;pointer-events:none;width:1px;height:1px;"
        );

        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        function dis(p1, p2) {
            return Math.sqrt(
                pow2(p1[0] - p2[0]) + pow2(p1[1] - p2[1]) + pow2(p1[2] - p2[2])
            );
        }
        function pow2(a) {
            return a * a;
        }
        function assign(source, target, targetIndex) {
            for (let i = targetIndex; i < targetIndex + 3; i++) {
                target[targetIndex] = source[0];
                target[targetIndex + 1] = source[1];
                target[targetIndex + 2] = source[2];
            }
        }
        function mapColor() {
            for (let i = 0; i < data.length; i += 4) {
                if (!data[i + 3]) {
                    continue;
                }

                const p = [data[i], data[i + 1], data[i + 2], data[i + 3]];
                const d1 = dis(colorMaps[0][0], p);
                if (!d1) {
                    assign(colorMaps[0][1], data, i);
                    continue;
                }
                const d2 = dis(colorMaps[1][0], p);
                if (!d2) {
                    assign(colorMaps[1][1], data, i);
                    continue;
                }
                const d = dis(colorMaps[0][0], colorMaps[1][0]);
                const cos1 = (pow2(d1) + pow2(d) - pow2(d2)) / (2 * d1 * d);
                const cos2 = (pow2(d2) + pow2(d) - pow2(d1)) / (2 * d2 * d);

                const ratio = (cos1 * d2) / (cos2 * d1 + cos1 * d2);

                data[i] =
                    colorMaps[0][1][0] * ratio +
                    colorMaps[1][1][0] * (1 - ratio);
                data[i + 1] =
                    colorMaps[0][1][1] * ratio +
                    colorMaps[1][1][1] * (1 - ratio);
                data[i + 2] =
                    colorMaps[0][1][2] * ratio +
                    colorMaps[1][1][2] * (1 - ratio);
            }
            ctx.putImageData(imageData, 0, 0);
        }
        mapColor();
        const dataUrl = canvas.toDataURL("image/png");
        document.body.removeChild(canvas);
        return dataUrl;
    });
}
