import React from "react";

export function MathRenderer({ content }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    // Function to process LaTeX notation in the content
    const processLatex = (text) => {
      if (!text) return "";

      // Convert matrix notations
      let processed = text
        .replace(/\\begin{matrix}/g, "\\begin{pmatrix}")
        .replace(/\\end{matrix}/g, "\\end{pmatrix}");

      // Fix display math notation - ensure proper delimiters for block equations
      processed = processed.replace(/\$\$(.*?)\$\$/gs, function (match, p1) {
        return `\\[${p1}\\]`;
      });

      // Fix inline math notation - ensure proper delimiters for inline equations
      processed = processed.replace(
        /(?<!\$)\$((?!\$).+?)\$(?!\$)/g,
        function (match, p1) {
          return `\\(${p1}\\)`;
        }
      );

      // Handle specific LaTeX commands that might be problematic
      const commands = [
        "begin",
        "end",
        "frac",
        "text",
        "left",
        "right",
        "cdot",
        "matrix",
        "bmatrix",
        "pmatrix",
        "cases",
        "sqrt",
        "sum",
        "int",
        "lim",
        "infty",
        "partial",
        "nabla",
        "times",
        "div",
        "approx",
        "neq",
        "geq",
        "leq",
        "in",
        "notin",
        "subset",
        "supset",
        "cup",
        "cap",
        "mathbb",
        "mathcal",
        "mathrm",
        "mathbf",
      ];

      for (const cmd of commands) {
        // Make sure all LaTeX commands have backslashes
        const regex = new RegExp(`(?<!\\\\)${cmd}`, "g");
        processed = processed.replace(regex, `\\${cmd}`);
      }

      return processed;
    };

    // Only process content if it exists
    if (content && containerRef.current) {
      // Set the processed content
      containerRef.current.innerHTML = processLatex(content);

      // Typeset the math if MathJax is available
      if (window.MathJax) {
        window.MathJax.typesetPromise([containerRef.current]).catch((err) => {
          console.error("MathJax typesetting failed:", err);
        });
      }
    }
  }, [content]);

  // Add MathJax script if not already present
  React.useEffect(() => {
    if (!window.MathJax) {
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      script.id = "MathJax-script";

      // Configure MathJax
      window.MathJax = {
        tex: {
          inlineMath: [["\\(", "\\)"]],
          displayMath: [["\\[", "\\]"]],
          processEscapes: true,
          processEnvironments: true,
        },
        options: {
          skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
        },
        startup: {
          pageReady: () => {
            return window.MathJax.startup.defaultPageReady().then(() => {
              if (containerRef.current) {
                window.MathJax.typesetPromise([containerRef.current]);
              }
            });
          },
        },
      };

      document.head.appendChild(script);
    }
  }, []);

  // Define some CSS classes for math styling
  const mathContentStyles = `
    .math-content {
      font-size: 16px;
      line-height: 1.6;
      color: #333;
    }
    .math-content p {
      margin-bottom: 1rem;
    }
    .math-content .matrix {
      margin: 1rem 0;
    }
    .math-content .MathJax {
      overflow-x: auto;
      max-width: 100%;
    }
  `;

  return (
    <>
      <style>{mathContentStyles}</style>
      <div className="math-content" ref={containerRef} />
    </>
  );
}
