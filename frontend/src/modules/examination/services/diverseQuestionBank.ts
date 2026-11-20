/**
 * Curated Diverse Multi-Type Question Bank
 * Provides rich question pools for:
 *   - 'multiple_correct' (Multi-Select Checkboxes)
 *   - 'true_false' (Conceptual True / False)
 *   - 'fill_blanks' (Fill in missing term/keyword)
 *   - 'coding' (Coding Problem Challenges)
 * across HTML, CSS, JavaScript, React, Python, Java, Data Science, Flutter, Cybersecurity, UI/UX, Testing & Aptitude.
 */

import { ExamQuestion } from '../types';

export const DIVERSE_MULTI_TYPE_QUESTIONS: ExamQuestion[] = [
  {
    "id": "div-html-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are block-level elements by default in HTML? (Select all that apply)",
    "options": [
      "<div>",
      "<p>",
      "<span>",
      "<h1> to <h6>",
      "<a>"
    ],
    "correct_answer": [
      0,
      1,
      3
    ],
    "marks": 4,
    "topic": "HTML",
    "subtopic": "Introduction & Structure",
    "difficulty": "easy",
    "explanation": "<div>, <p>, and <h1>-<h6> are block-level elements. <span> and <a> are inline elements."
  },
  {
    "id": "div-html-mc-2",
    "type": "multiple_correct",
    "question_text": "Which of the following are modern semantic HTML5 layout tags? (Select all that apply)",
    "options": [
      "<header>",
      "<div>",
      "<article>",
      "<span>",
      "<aside>",
      "<footer>"
    ],
    "correct_answer": [
      0,
      2,
      4,
      5
    ],
    "marks": 4,
    "topic": "HTML",
    "subtopic": "Semantic HTML5 Architecture",
    "difficulty": "easy",
    "explanation": "<header>, <article>, <aside>, and <footer> provide semantic structure."
  },
  {
    "id": "div-html-mc-3",
    "type": "multiple_correct",
    "question_text": "Which attributes can be used on HTML5 <input> elements for client-side form validation? (Select all that apply)",
    "options": [
      "required",
      "pattern",
      "href",
      "minlength",
      "maxlength",
      "src"
    ],
    "correct_answer": [
      0,
      1,
      3,
      4
    ],
    "marks": 4,
    "topic": "HTML",
    "subtopic": "Forms, Inputs & Controls",
    "difficulty": "medium",
    "explanation": "required, pattern, minlength, and maxlength are form validation attributes."
  },
  {
    "id": "div-html-mc-4",
    "type": "multiple_correct",
    "question_text": "Which of the following HTML tags are void elements (self-closing without closing tag)? (Select all that apply)",
    "options": [
      "<img>",
      "<br>",
      "<p>",
      "<hr>",
      "<input>",
      "<div>"
    ],
    "correct_answer": [
      0,
      1,
      3,
      4
    ],
    "marks": 4,
    "topic": "HTML",
    "subtopic": "Introduction & Structure",
    "difficulty": "medium",
    "explanation": "<img>, <br>, <hr>, and <input> cannot contain any content and have no closing tag."
  },
  {
    "id": "div-html-mc-5",
    "type": "multiple_correct",
    "question_text": "Which HTML elements are used to construct tabular data structures? (Select all that apply)",
    "options": [
      "<table>",
      "<tr>",
      "<th>",
      "<td>",
      "<thead>",
      "<tgrid>"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3,
      4
    ],
    "marks": 4,
    "topic": "HTML",
    "subtopic": "Tables & Tabular Data",
    "difficulty": "easy",
    "explanation": "<table>, <tr>, <th>, <td>, and <thead> are standard table architecture tags."
  },
  {
    "id": "div-html-tf-1",
    "type": "true_false",
    "question_text": "<!DOCTYPE html> is an HTML tag and requires a closing </!DOCTYPE> tag.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Introduction & Structure",
    "difficulty": "easy",
    "explanation": "<!DOCTYPE html> is a document type declaration informing the browser to render in standard HTML5 mode."
  },
  {
    "id": "div-html-tf-2",
    "type": "true_false",
    "question_text": "The <title> element must be placed inside the <head> section of an HTML document.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Introduction & Structure",
    "difficulty": "easy",
    "explanation": "<title> defines the document title displayed in the browser tab and must reside in <head>."
  },
  {
    "id": "div-html-tf-3",
    "type": "true_false",
    "question_text": "The id attribute value must be unique within an entire HTML document.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Containers & Div/Span",
    "difficulty": "easy",
    "explanation": "In HTML, id attributes must be unique per document."
  },
  {
    "id": "div-html-tf-4",
    "type": "true_false",
    "question_text": "The target=\"_blank\" attribute causes a link to open in a new browser tab or window.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Hyperlinks & Media",
    "difficulty": "easy",
    "explanation": "Setting target=\"_blank\" instructs the browser to open the hyperlink in a new browsing context."
  },
  {
    "id": "div-html-tf-5",
    "type": "true_false",
    "question_text": "Radio buttons in the same group can have different name attributes and still allow only one selection.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Forms, Inputs & Controls",
    "difficulty": "medium",
    "explanation": "Radio buttons must share the exact same name attribute to belong to the same mutually exclusive group."
  },
  {
    "id": "div-html-tf-6",
    "type": "true_false",
    "question_text": "Inline CSS applied via the style attribute has higher specificity than external stylesheet rules (excluding !important).",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Inline CSS & Styling",
    "difficulty": "easy",
    "explanation": "Inline styles have a specificity weight of 1-0-0-0, overriding class, id, and tag selectors in external CSS."
  },
  {
    "id": "div-html-tf-7",
    "type": "true_false",
    "question_text": "The <span> element is a block-level element by default in HTML.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "HTML",
    "subtopic": "Containers & Div/Span",
    "difficulty": "easy",
    "explanation": "<span> is an inline element used to style specific portions of text without breaking the line."
  },
  {
    "id": "div-html-fb-1",
    "type": "fill_blanks",
    "question_text": "In HTML, the ______ attribute on an <a> anchor element specifies the destination URL of the link.",
    "options": [
      "href",
      "src",
      "target",
      "link"
    ],
    "correct_answer": "href",
    "marks": 3,
    "topic": "HTML",
    "subtopic": "Hyperlinks & Media",
    "difficulty": "easy",
    "explanation": "href (Hypertext Reference) specifies the link destination URL."
  },
  {
    "id": "div-html-fb-2",
    "type": "fill_blanks",
    "question_text": "The ______ attribute on the <img> tag specifies alternative text for accessibility and when an image fails to load.",
    "options": [
      "alt",
      "title",
      "src",
      "caption"
    ],
    "correct_answer": "alt",
    "marks": 3,
    "topic": "HTML",
    "subtopic": "Hyperlinks & Media",
    "difficulty": "easy",
    "explanation": "The alt attribute provides alternative text used by screen readers and when images fail to render."
  },
  {
    "id": "div-html-fb-3",
    "type": "fill_blanks",
    "question_text": "In an HTML table, the ______ attribute is used to merge two or more columns into a single data cell.",
    "options": [
      "colspan",
      "rowspan",
      "span",
      "merge"
    ],
    "correct_answer": "colspan",
    "marks": 3,
    "topic": "HTML",
    "subtopic": "Tables & Tabular Data",
    "difficulty": "medium",
    "explanation": "colspan merges horizontal adjacent columns into one table cell."
  },
  {
    "id": "div-html-fb-4",
    "type": "fill_blanks",
    "question_text": "To create a multi-line text input field in an HTML form, use the ______ element.",
    "options": [
      "<textarea>",
      "<input type=\"multiline\">",
      "<textbox>",
      "<text>"
    ],
    "correct_answer": "<textarea>",
    "marks": 3,
    "topic": "HTML",
    "subtopic": "Forms, Inputs & Controls",
    "difficulty": "easy",
    "explanation": "<textarea> provides a scrollable multi-line text entry container."
  },
  {
    "id": "div-html-fb-5",
    "type": "fill_blanks",
    "question_text": "The HTTP method used to send sensitive form data in the body of an HTTP request is ______ .",
    "options": [
      "POST",
      "GET",
      "PUT",
      "FETCH"
    ],
    "correct_answer": "POST",
    "marks": 3,
    "topic": "HTML",
    "subtopic": "Forms, Inputs & Controls",
    "difficulty": "easy",
    "explanation": "POST transmits data inside the request body rather than visible query parameters in the URL."
  },
  {
    "id": "div-css-mc-1",
    "type": "multiple_correct",
    "question_text": "Which CSS properties belong to the standard CSS Box Model? (Select all that apply)",
    "options": [
      "margin",
      "padding",
      "border",
      "content",
      "opacity"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "CSS",
    "subtopic": "Box Model",
    "difficulty": "easy",
    "explanation": "The Box Model consists of content, padding, border, and margin."
  },
  {
    "id": "div-css-mc-2",
    "type": "multiple_correct",
    "question_text": "Which of the following are valid values for the CSS display property? (Select all that apply)",
    "options": [
      "flex",
      "grid",
      "inline-block",
      "none",
      "center",
      "block"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3,
      5
    ],
    "marks": 4,
    "topic": "CSS",
    "subtopic": "Display & Positioning",
    "difficulty": "easy",
    "explanation": "flex, grid, inline-block, none, and block are valid display values. center is not a display value."
  },
  {
    "id": "div-css-mc-3",
    "type": "multiple_correct",
    "question_text": "Which CSS Flexbox properties are applied to the flex container (parent element)? (Select all that apply)",
    "options": [
      "justify-content",
      "align-items",
      "flex-direction",
      "align-self",
      "flex-wrap",
      "flex-grow"
    ],
    "correct_answer": [
      0,
      1,
      2,
      4
    ],
    "marks": 4,
    "topic": "CSS",
    "subtopic": "Flexbox Layout",
    "difficulty": "medium",
    "explanation": "justify-content, align-items, flex-direction, and flex-wrap apply to container. align-self and flex-grow apply to flex items."
  },
  {
    "id": "div-css-mc-4",
    "type": "multiple_correct",
    "question_text": "Which of the following are standard CSS pseudo-classes? (Select all that apply)",
    "options": [
      ":hover",
      ":focus",
      ":nth-child()",
      "::before",
      ":active",
      "::after"
    ],
    "correct_answer": [
      0,
      1,
      2,
      4
    ],
    "marks": 4,
    "topic": "CSS",
    "subtopic": "Selectors & Specificity",
    "difficulty": "medium",
    "explanation": ":hover, :focus, :nth-child(), and :active are pseudo-classes (:). ::before and ::after are pseudo-elements (::)."
  },
  {
    "id": "div-css-tf-1",
    "type": "true_false",
    "question_text": "When using box-sizing: border-box, padding and border are included within the element's specified width and height.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "CSS",
    "subtopic": "Box Model",
    "difficulty": "easy",
    "explanation": "border-box tells the browser to account for border and padding inside the declared width/height."
  },
  {
    "id": "div-css-tf-2",
    "type": "true_false",
    "question_text": "A CSS ID selector (#main) has higher specificity than a CSS Class selector (.main).",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "CSS",
    "subtopic": "Selectors & Specificity",
    "difficulty": "easy",
    "explanation": "ID selectors have specificity weight of 0-1-0-0, while class selectors have 0-0-1-0."
  },
  {
    "id": "div-css-tf-3",
    "type": "true_false",
    "question_text": "An element with position: absolute is always positioned relative to the browser viewport.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "CSS",
    "subtopic": "Display & Positioning",
    "difficulty": "medium",
    "explanation": "position: absolute positions relative to the nearest positioned ancestor (position != static), falling back to <html>."
  },
  {
    "id": "div-css-tf-4",
    "type": "true_false",
    "question_text": "CSS Grid is a two-dimensional layout system that can arrange items in both rows and columns simultaneously.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "CSS",
    "subtopic": "CSS Grid",
    "difficulty": "easy",
    "explanation": "CSS Grid is 2D (rows + columns), whereas Flexbox is primarily 1D (row or column)."
  },
  {
    "id": "div-css-tf-5",
    "type": "true_false",
    "question_text": "The z-index property works on elements that have position: static.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "CSS",
    "subtopic": "Display & Positioning",
    "difficulty": "medium",
    "explanation": "z-index only takes effect on positioned elements (relative, absolute, fixed, or sticky) and flex/grid items."
  },
  {
    "id": "div-css-fb-1",
    "type": "fill_blanks",
    "question_text": "In CSS Flexbox, the ______ property aligns flex items along the main axis.",
    "options": [
      "justify-content",
      "align-items",
      "align-content",
      "flex-direction"
    ],
    "correct_answer": "justify-content",
    "marks": 3,
    "topic": "CSS",
    "subtopic": "Flexbox Layout",
    "difficulty": "easy",
    "explanation": "justify-content distributes space along the main axis."
  },
  {
    "id": "div-css-fb-2",
    "type": "fill_blanks",
    "question_text": "In CSS Flexbox, the ______ property aligns flex items along the cross axis.",
    "options": [
      "align-items",
      "justify-content",
      "align-self",
      "flex-align"
    ],
    "correct_answer": "align-items",
    "marks": 3,
    "topic": "CSS",
    "subtopic": "Flexbox Layout",
    "difficulty": "easy",
    "explanation": "align-items controls alignment on the perpendicular cross axis."
  },
  {
    "id": "div-css-fb-3",
    "type": "fill_blanks",
    "question_text": "To apply CSS styles conditionally based on device viewport width, use a ______ query.",
    "options": [
      "@media",
      "@screen",
      "@viewport",
      "@container"
    ],
    "correct_answer": "@media",
    "marks": 3,
    "topic": "CSS",
    "subtopic": "Responsive Design & Media Queries",
    "difficulty": "easy",
    "explanation": "@media queries allow responsive styles according to device capabilities and screen size."
  },
  {
    "id": "div-css-fb-4",
    "type": "fill_blanks",
    "question_text": "The CSS relative length unit ______ is based on the font-size of the root <html> element.",
    "options": [
      "rem",
      "em",
      "ch",
      "vw"
    ],
    "correct_answer": "rem",
    "marks": 3,
    "topic": "CSS",
    "subtopic": "Typography & Colors",
    "difficulty": "medium",
    "explanation": "rem (root em) always scales relative to the root <html> font size, unlike em which scales to parent font size."
  },
  {
    "id": "div-js-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are primitive data types in modern JavaScript? (Select all that apply)",
    "options": [
      "string",
      "number",
      "boolean",
      "Array",
      "Symbol",
      "undefined",
      "Object"
    ],
    "correct_answer": [
      0,
      1,
      2,
      4,
      5
    ],
    "marks": 4,
    "topic": "JavaScript",
    "subtopic": "Variables & Data Types",
    "difficulty": "easy",
    "explanation": "string, number, boolean, symbol, undefined, null, and bigint are primitives. Array and Object are reference types."
  },
  {
    "id": "div-js-mc-2",
    "type": "multiple_correct",
    "question_text": "Which of the following Array methods return a NEW array without modifying the original array in-place? (Select all that apply)",
    "options": [
      "map()",
      "filter()",
      "slice()",
      "splice()",
      "push()",
      "concat()"
    ],
    "correct_answer": [
      0,
      1,
      2,
      5
    ],
    "marks": 4,
    "topic": "JavaScript",
    "subtopic": "Arrays & Array Methods",
    "difficulty": "medium",
    "explanation": "map, filter, slice, and concat return new arrays (pure/immutable). splice and push mutate the original array."
  },
  {
    "id": "div-js-mc-3",
    "type": "multiple_correct",
    "question_text": "Which keywords can be used to declare block-scoped variables in modern ES6+ JavaScript? (Select all that apply)",
    "options": [
      "let",
      "const",
      "var",
      "def",
      "val"
    ],
    "correct_answer": [
      0,
      1
    ],
    "marks": 4,
    "topic": "JavaScript",
    "subtopic": "Variables & Data Types",
    "difficulty": "easy",
    "explanation": "let and const are block-scoped. var is function-scoped."
  },
  {
    "id": "div-js-mc-4",
    "type": "multiple_correct",
    "question_text": "Which methods can be used to convert objects to JSON strings and parse JSON back to objects? (Select all that apply)",
    "options": [
      "JSON.stringify()",
      "JSON.parse()",
      "JSON.encode()",
      "JSON.decode()"
    ],
    "correct_answer": [
      0,
      1
    ],
    "marks": 4,
    "topic": "JavaScript",
    "subtopic": "Objects & JSON",
    "difficulty": "easy",
    "explanation": "JSON.stringify() serializes to string, and JSON.parse() parses strings back to JS data."
  },
  {
    "id": "div-js-tf-1",
    "type": "true_false",
    "question_text": "In JavaScript, typeof null evaluates to \"object\" due to a legacy language specification artifact.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "JavaScript",
    "subtopic": "Variables & Data Types",
    "difficulty": "medium",
    "explanation": "typeof null returns \"object\" because in early JS, values had type tags, and null was represented as 000 (object tag)."
  },
  {
    "id": "div-js-tf-2",
    "type": "true_false",
    "question_text": "A variable declared with const cannot have its internal properties modified if it holds an Object or Array.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "JavaScript",
    "subtopic": "Variables & Data Types",
    "difficulty": "easy",
    "explanation": "const prevents re-assignment of the variable binding, but object/array properties remain fully mutable."
  },
  {
    "id": "div-js-tf-3",
    "type": "true_false",
    "question_text": "Arrow functions in JavaScript have their own this context binding.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "JavaScript",
    "subtopic": "Functions & Scope",
    "difficulty": "medium",
    "explanation": "Arrow functions do not have their own this; they lexically inherit this from the surrounding scope."
  },
  {
    "id": "div-js-tf-4",
    "type": "true_false",
    "question_text": "NaN === NaN evaluates to false in JavaScript.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "JavaScript",
    "subtopic": "Variables & Data Types",
    "difficulty": "medium",
    "explanation": "NaN is the only value in JavaScript that is not equal to itself. Use Number.isNaN() to test."
  },
  {
    "id": "div-js-tf-5",
    "type": "true_false",
    "question_text": "Promises in JavaScript have three possible states: Pending, Fulfilled, and Rejected.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "JavaScript",
    "subtopic": "Async Programming & Promises",
    "difficulty": "easy",
    "explanation": "A Promise starts as Pending and settles into either Fulfilled or Rejected."
  },
  {
    "id": "div-js-fb-1",
    "type": "fill_blanks",
    "question_text": "The array method ______ executes a reducer function on each item of the array to return a single accumulated value.",
    "options": [
      "reduce()",
      "map()",
      "filter()",
      "forEach()"
    ],
    "correct_answer": "reduce()",
    "marks": 3,
    "topic": "JavaScript",
    "subtopic": "Arrays & Array Methods",
    "difficulty": "medium",
    "explanation": "reduce() iterates through an array applying an accumulator callback to reduce it to a single value."
  },
  {
    "id": "div-js-fb-2",
    "type": "fill_blanks",
    "question_text": "The method ______ on an Event object prevents the browser from executing its default action (such as page reload on submit).",
    "options": [
      "preventDefault()",
      "stopPropagation()",
      "stop()",
      "cancel()"
    ],
    "correct_answer": "preventDefault()",
    "marks": 3,
    "topic": "JavaScript",
    "subtopic": "Events & Listeners",
    "difficulty": "easy",
    "explanation": "event.preventDefault() stops the default browser action."
  },
  {
    "id": "div-js-fb-3",
    "type": "fill_blanks",
    "question_text": "To handle exceptions in async functions using async/await syntax, code should be wrapped inside a ______ block.",
    "options": [
      "try...catch",
      "if...else",
      "catch...finally",
      "onError"
    ],
    "correct_answer": "try...catch",
    "marks": 3,
    "topic": "JavaScript",
    "subtopic": "Async/Await & Fetch API",
    "difficulty": "easy",
    "explanation": "try...catch blocks capture rejected promises when awaiting asynchronous operations."
  },
  {
    "id": "div-js-fb-4",
    "type": "fill_blanks",
    "question_text": "The ES6 syntax ______ (three dots) is used to unpack elements of an iterable into another array or function arguments.",
    "options": [
      "spread operator (...)",
      "rest operator",
      "destructuring",
      "arrow"
    ],
    "correct_answer": "spread operator (...)",
    "marks": 3,
    "topic": "JavaScript",
    "subtopic": "Objects & JSON",
    "difficulty": "easy",
    "explanation": "The spread operator (...) spreads array items or object properties."
  },
  {
    "id": "div-py-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following built-in collection types in Python are mutable? (Select all that apply)",
    "options": [
      "List (list)",
      "Tuple (tuple)",
      "Dictionary (dict)",
      "Set (set)",
      "String (str)"
    ],
    "correct_answer": [
      0,
      2,
      3
    ],
    "marks": 4,
    "topic": "Python",
    "subtopic": "Basics & Syntax",
    "difficulty": "medium",
    "explanation": "Lists, dictionaries, and sets are mutable. Tuples and strings are immutable."
  },
  {
    "id": "div-py-mc-2",
    "type": "multiple_correct",
    "question_text": "Which modes can be passed to Python's open() built-in function? (Select all that apply)",
    "options": [
      "\"r\" (read)",
      "\"w\" (write)",
      "\"a\" (append)",
      "\"rb\" (binary read)",
      "\"read\""
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Python",
    "subtopic": "File Handling & Modules",
    "difficulty": "easy",
    "explanation": "\"r\", \"w\", \"a\", and \"rb\" are standard file modes in Python."
  },
  {
    "id": "div-py-mc-3",
    "type": "multiple_correct",
    "question_text": "Which Object-Oriented Programming (OOP) concepts are supported natively in Python? (Select all that apply)",
    "options": [
      "Inheritance",
      "Multiple Inheritance",
      "Encapsulation",
      "Polymorphism"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Python",
    "subtopic": "Object-Oriented Programming (OOP)",
    "difficulty": "medium",
    "explanation": "Python supports all four pillars of OOP including multiple inheritance via C3 Linearization (MRO)."
  },
  {
    "id": "div-py-tf-1",
    "type": "true_false",
    "question_text": "In Python, strings are immutable objects and their individual characters cannot be assigned to in-place.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Python",
    "subtopic": "Strings & Slicing",
    "difficulty": "easy",
    "explanation": "Python strings cannot be modified in-place; attempting s[0] = \"x\" raises a TypeError."
  },
  {
    "id": "div-py-tf-2",
    "type": "true_false",
    "question_text": "Python uses curly braces {} to define code blocks for loops, functions, and classes.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Python",
    "subtopic": "Basics & Syntax",
    "difficulty": "easy",
    "explanation": "Python uses indentation (whitespace) to delimit code blocks instead of curly braces."
  },
  {
    "id": "div-py-tf-3",
    "type": "true_false",
    "question_text": "In Python 3.7+, standard dictionaries (dict) maintain key insertion order.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Python",
    "subtopic": "Dictionaries & Sets",
    "difficulty": "medium",
    "explanation": "Starting with Python 3.7, dictionaries are officially guaranteed to preserve insertion order."
  },
  {
    "id": "div-py-tf-4",
    "type": "true_false",
    "question_text": "Python sets allow duplicate elements to be stored.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Python",
    "subtopic": "Dictionaries & Sets",
    "difficulty": "easy",
    "explanation": "Sets are unordered collections of unique elements; duplicate values are automatically discarded."
  },
  {
    "id": "div-py-tf-5",
    "type": "true_false",
    "question_text": "The pass statement in Python is a null statement used as a placeholder where syntactically code is required.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Python",
    "subtopic": "Basics & Syntax",
    "difficulty": "easy",
    "explanation": "pass executes no operation and is used as a syntactic placeholder."
  },
  {
    "id": "div-py-fb-1",
    "type": "fill_blanks",
    "question_text": "In Python, the list method ______ adds an element to the very end of the list in-place.",
    "options": [
      "append()",
      "extend()",
      "push()",
      "insert()"
    ],
    "correct_answer": "append()",
    "marks": 3,
    "topic": "Python",
    "subtopic": "Lists & Tuples",
    "difficulty": "easy",
    "explanation": "list.append(x) appends an item to the end of the list."
  },
  {
    "id": "div-py-fb-2",
    "type": "fill_blanks",
    "question_text": "The special dunder method ______ acts as the constructor initializer when creating a new instance of a Python class.",
    "options": [
      "__init__",
      "__new__",
      "__construct__",
      "__start__"
    ],
    "correct_answer": "__init__",
    "marks": 3,
    "topic": "Python",
    "subtopic": "Object-Oriented Programming (OOP)",
    "difficulty": "easy",
    "explanation": "__init__ is the initializer method called when a class is instantiated."
  },
  {
    "id": "div-py-fb-3",
    "type": "fill_blanks",
    "question_text": "The keyword ______ in Python pauses function execution and returns a generator iterator value.",
    "options": [
      "yield",
      "return",
      "gen",
      "async"
    ],
    "correct_answer": "yield",
    "marks": 3,
    "topic": "Python",
    "subtopic": "Functions & Lambdas",
    "difficulty": "medium",
    "explanation": "yield produces a generator that evaluates values lazily."
  },
  {
    "id": "div-py-fb-4",
    "type": "fill_blanks",
    "question_text": "To ensure proper resource cleanup and automatic file closing, use the Python ______ statement.",
    "options": [
      "with",
      "try",
      "finally",
      "using"
    ],
    "correct_answer": "with",
    "marks": 3,
    "topic": "Python",
    "subtopic": "File Handling & Modules",
    "difficulty": "easy",
    "explanation": "The with statement creates a context manager that automatically closes files."
  },
  {
    "id": "div-java-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following classes implement the java.util.List interface in Java? (Select all that apply)",
    "options": [
      "ArrayList",
      "LinkedList",
      "Vector",
      "HashSet",
      "HashMap"
    ],
    "correct_answer": [
      0,
      1,
      2
    ],
    "marks": 4,
    "topic": "Java",
    "subtopic": "Collections Framework",
    "difficulty": "easy",
    "explanation": "ArrayList, LinkedList, and Vector implement List. HashSet implements Set, HashMap implements Map."
  },
  {
    "id": "div-java-mc-2",
    "type": "multiple_correct",
    "question_text": "Which of the following are valid access modifiers in Java? (Select all that apply)",
    "options": [
      "public",
      "private",
      "protected",
      "default (package-private)",
      "internal",
      "friend"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Java",
    "subtopic": "Classes, Objects & Constructors",
    "difficulty": "easy",
    "explanation": "Java has 4 access levels: public, protected, default, and private. internal and friend do not exist in Java."
  },
  {
    "id": "div-java-mc-3",
    "type": "multiple_correct",
    "question_text": "Which of the following are primitive data types in Java? (Select all that apply)",
    "options": [
      "int",
      "boolean",
      "double",
      "String",
      "char",
      "Integer"
    ],
    "correct_answer": [
      0,
      1,
      2,
      4
    ],
    "marks": 4,
    "topic": "Java",
    "subtopic": "Data Types & Control Flow",
    "difficulty": "easy",
    "explanation": "int, boolean, double, and char are 4 of the 8 Java primitives. String and Integer are reference types (classes)."
  },
  {
    "id": "div-java-mc-4",
    "type": "multiple_correct",
    "question_text": "Which keywords in Java are used in Exception Handling? (Select all that apply)",
    "options": [
      "try",
      "catch",
      "finally",
      "throw",
      "throws",
      "except"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3,
      4
    ],
    "marks": 4,
    "topic": "Java",
    "subtopic": "Exceptions & File I/O",
    "difficulty": "medium",
    "explanation": "try, catch, finally, throw, and throws are Java exception handling keywords."
  },
  {
    "id": "div-java-tf-1",
    "type": "true_false",
    "question_text": "In Java, a class can extend multiple parent classes simultaneously (multiple class inheritance).",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Java",
    "subtopic": "OOP - Inheritance & Polymorphism",
    "difficulty": "easy",
    "explanation": "Java does not support multiple class inheritance to prevent the Diamond Problem; it supports multiple interface implementation."
  },
  {
    "id": "div-java-tf-2",
    "type": "true_false",
    "question_text": "In Java, String objects are immutable and stored in the String Constant Pool.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Java",
    "subtopic": "Data Types & Control Flow",
    "difficulty": "easy",
    "explanation": "Strings in Java are strictly immutable. Any modification generates a new String instance."
  },
  {
    "id": "div-java-tf-3",
    "type": "true_false",
    "question_text": "Static methods in Java can access non-static instance variables directly without creating an object.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Java",
    "subtopic": "Classes, Objects & Constructors",
    "difficulty": "medium",
    "explanation": "Static methods belong to the class and have no this reference; they cannot access instance members directly."
  },
  {
    "id": "div-java-tf-4",
    "type": "true_false",
    "question_text": "Java 8 interfaces can contain default and static methods with concrete implementation bodies.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Java",
    "subtopic": "OOP - Abstraction & Interfaces",
    "difficulty": "medium",
    "explanation": "Java 8 introduced default and static interface methods to enable backwards-compatible API evolution."
  },
  {
    "id": "div-java-tf-5",
    "type": "true_false",
    "question_text": "Bytecode in Java (.class files) is platform-independent and executed by the Java Virtual Machine (JVM).",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Java",
    "subtopic": "JVM & Fundamentals",
    "difficulty": "easy",
    "explanation": "Java's \"Write Once, Run Anywhere\" philosophy relies on platform-independent bytecode interpreted by host JVMs."
  },
  {
    "id": "div-java-fb-1",
    "type": "fill_blanks",
    "question_text": "In Java, the ______ keyword is used by a child subclass to inherit from a parent class.",
    "options": [
      "extends",
      "implements",
      "inherits",
      "super"
    ],
    "correct_answer": "extends",
    "marks": 3,
    "topic": "Java",
    "subtopic": "OOP - Inheritance & Polymorphism",
    "difficulty": "easy",
    "explanation": "extends establishes subclass inheritance in Java."
  },
  {
    "id": "div-java-fb-2",
    "type": "fill_blanks",
    "question_text": "In Java, the ______ keyword is used by a class to implement the methods declared in an interface.",
    "options": [
      "implements",
      "extends",
      "interface",
      "uses"
    ],
    "correct_answer": "implements",
    "marks": 3,
    "topic": "Java",
    "subtopic": "OOP - Abstraction & Interfaces",
    "difficulty": "easy",
    "explanation": "implements binds a class to fulfill an interface contract."
  },
  {
    "id": "div-java-fb-3",
    "type": "fill_blanks",
    "question_text": "The Java Collection class ______ stores key-value mappings with O(1) average lookup and insertion time.",
    "options": [
      "HashMap",
      "ArrayList",
      "TreeSet",
      "LinkedList"
    ],
    "correct_answer": "HashMap",
    "marks": 3,
    "topic": "Java",
    "subtopic": "Collections Framework",
    "difficulty": "easy",
    "explanation": "HashMap uses hashing algorithms to deliver O(1) average performance for get and put."
  },
  {
    "id": "div-java-fb-4",
    "type": "fill_blanks",
    "question_text": "The Java keyword ______ prevents a method from being overridden and prevents a class from being subclassed.",
    "options": [
      "final",
      "static",
      "const",
      "immutable"
    ],
    "correct_answer": "final",
    "marks": 3,
    "topic": "Java",
    "subtopic": "Classes, Objects & Constructors",
    "difficulty": "easy",
    "explanation": "final classes cannot be inherited, final methods cannot be overridden, and final variables cannot be reassigned."
  },
  {
    "id": "div-react-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are official standard React Hooks? (Select all that apply)",
    "options": [
      "useState",
      "useEffect",
      "useContext",
      "useRef",
      "useRouter",
      "useMemo"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3,
      5
    ],
    "marks": 4,
    "topic": "React",
    "subtopic": "Props & State (useState)",
    "difficulty": "easy",
    "explanation": "useState, useEffect, useContext, useRef, and useMemo are standard React Hooks. useRouter is from Next.js."
  },
  {
    "id": "div-react-mc-2",
    "type": "multiple_correct",
    "question_text": "Which rules must be strictly adhered to when working with React Hooks? (Select all that apply)",
    "options": [
      "Only call Hooks at the top level of your component (never inside loops, conditions, or nested functions)",
      "Only call Hooks from React function components or custom Hooks",
      "Hooks can be called inside class component render methods",
      "Hook names should conventionally begin with \"use\""
    ],
    "correct_answer": [
      0,
      1,
      3
    ],
    "marks": 4,
    "topic": "React",
    "subtopic": "Props & State (useState)",
    "difficulty": "medium",
    "explanation": "Hooks must execute in the exact same order on every render and cannot run in classes."
  },
  {
    "id": "div-react-tf-1",
    "type": "true_false",
    "question_text": "In React, component props are read-only (immutable) and child components should never modify them directly.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "React",
    "subtopic": "Props & State (useState)",
    "difficulty": "easy",
    "explanation": "Props are strictly read-only to preserve unidirectional data flow in React."
  },
  {
    "id": "div-react-tf-2",
    "type": "true_false",
    "question_text": "Directly modifying a state variable (e.g. count = count + 1) will trigger a component re-render in React.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "React",
    "subtopic": "Props & State (useState)",
    "difficulty": "easy",
    "explanation": "React state must be updated using the setter function (e.g. setCount) so React is notified to schedule a re-render."
  },
  {
    "id": "div-react-tf-3",
    "type": "true_false",
    "question_text": "The Virtual DOM is a lightweight JavaScript object representation of the real DOM maintained by React.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "React",
    "subtopic": "JSX & Components",
    "difficulty": "easy",
    "explanation": "React compares the Virtual DOM with previous snapshots (diffing algorithm) to batch minimal real DOM updates."
  },
  {
    "id": "div-react-fb-1",
    "type": "fill_blanks",
    "question_text": "The React Hook used to manage side effects such as data fetching, subscriptions, and DOM mutations is ______ .",
    "options": [
      "useEffect",
      "useState",
      "useMemo",
      "useReducer"
    ],
    "correct_answer": "useEffect",
    "marks": 3,
    "topic": "React",
    "subtopic": "Effects & Lifecycle (useEffect)",
    "difficulty": "easy",
    "explanation": "useEffect manages component side effects and synchronization."
  },
  {
    "id": "div-react-fb-2",
    "type": "fill_blanks",
    "question_text": "When rendering elements from an array using map() in React, each item must be assigned a unique ______ prop.",
    "options": [
      "key",
      "id",
      "index",
      "ref"
    ],
    "correct_answer": "key",
    "marks": 3,
    "topic": "React",
    "subtopic": "Lists & Keys",
    "difficulty": "easy",
    "explanation": "The key prop helps React identify which items have changed, been added, or removed."
  },
  {
    "id": "div-ds-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are standard SQL JOIN types? (Select all that apply)",
    "options": [
      "INNER JOIN",
      "LEFT OUTER JOIN",
      "RIGHT OUTER JOIN",
      "FULL OUTER JOIN",
      "MIDDLE JOIN"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Data Science",
    "subtopic": "Database & SQL",
    "difficulty": "easy",
    "explanation": "INNER, LEFT, RIGHT, and FULL OUTER are standard SQL JOIN operations."
  },
  {
    "id": "div-ds-mc-2",
    "type": "multiple_correct",
    "question_text": "Which of the following are widely used Python libraries in Data Science and Machine Learning? (Select all that apply)",
    "options": [
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Scikit-Learn",
      "Spring Boot"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Data Science",
    "subtopic": "Python for Data Science",
    "difficulty": "easy",
    "explanation": "NumPy, Pandas, Matplotlib, and Scikit-Learn form the core scientific Python stack."
  },
  {
    "id": "div-ds-tf-1",
    "type": "true_false",
    "question_text": "A SQL PRIMARY KEY constraint uniquely identifies each row in a table and cannot contain NULL values.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Data Science",
    "subtopic": "Database & SQL",
    "difficulty": "easy",
    "explanation": "PRIMARY KEY enforces both UNIQUE and NOT NULL constraints."
  },
  {
    "id": "div-ds-tf-2",
    "type": "true_false",
    "question_text": "In Pandas, a DataFrame is a 2-dimensional labeled data structure with columns that can be of different data types.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Data Science",
    "subtopic": "Python for Data Science",
    "difficulty": "easy",
    "explanation": "Pandas DataFrames are 2D tabular data structures with heterogeneous columns."
  },
  {
    "id": "div-ds-fb-1",
    "type": "fill_blanks",
    "question_text": "The SQL keyword ______ is used in a SELECT statement to return only unique values and remove duplicates.",
    "options": [
      "DISTINCT",
      "UNIQUE",
      "DIFFERENT",
      "TOP"
    ],
    "correct_answer": "DISTINCT",
    "marks": 3,
    "topic": "Data Science",
    "subtopic": "Database & SQL",
    "difficulty": "easy",
    "explanation": "SELECT DISTINCT filters out duplicate result rows."
  },
  {
    "id": "div-ds-fb-2",
    "type": "fill_blanks",
    "question_text": "In SQL queries containing a GROUP BY clause, aggregated filter conditions must be placed inside the ______ clause.",
    "options": [
      "HAVING",
      "WHERE",
      "ORDER BY",
      "LIMIT"
    ],
    "correct_answer": "HAVING",
    "marks": 3,
    "topic": "Data Science",
    "subtopic": "Database & SQL",
    "difficulty": "medium",
    "explanation": "HAVING filters groups created by GROUP BY, while WHERE filters individual rows prior to grouping."
  },
  {
    "id": "div-flutter-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are built-in layout widgets in Flutter? (Select all that apply)",
    "options": [
      "Row",
      "Column",
      "Stack",
      "Wrap",
      "DivElement"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Flutter",
    "subtopic": "Widgets & Layouts",
    "difficulty": "easy",
    "explanation": "Row, Column, Stack, and Wrap are standard Flutter layout widgets."
  },
  {
    "id": "div-flutter-mc-2",
    "type": "multiple_correct",
    "question_text": "Which state management solutions are widely used in the Flutter ecosystem? (Select all that apply)",
    "options": [
      "Provider",
      "Riverpod",
      "Bloc / Cubit",
      "Redux",
      "Spring Data"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Flutter",
    "subtopic": "State Management",
    "difficulty": "medium",
    "explanation": "Provider, Riverpod, and Bloc are standard Flutter state management architectures."
  },
  {
    "id": "div-flutter-tf-1",
    "type": "true_false",
    "question_text": "StatelessWidget widgets in Flutter are immutable and cannot change their internal properties once constructed.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Flutter",
    "subtopic": "Widget Architecture",
    "difficulty": "easy",
    "explanation": "StatelessWidget configuration is completely immutable."
  },
  {
    "id": "div-flutter-tf-2",
    "type": "true_false",
    "question_text": "Flutter compiles directly to native ARM machine code for production iOS and Android builds without a JavaScript bridge.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Flutter",
    "subtopic": "Flutter Architecture",
    "difficulty": "easy",
    "explanation": "Flutter uses ahead-of-time (AOT) compilation to native machine code."
  },
  {
    "id": "div-flutter-tf-3",
    "type": "true_false",
    "question_text": "Calling Hot Reload in Flutter causes the app state to reset and restarts the application from main().",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Flutter",
    "subtopic": "Tooling & CLI",
    "difficulty": "easy",
    "explanation": "Hot Reload injects code changes while preserving the current application state."
  },
  {
    "id": "div-flutter-fb-1",
    "type": "fill_blanks",
    "question_text": "The primary entry point function of every Flutter and Dart application is ______().",
    "options": [
      "main",
      "runApp",
      "start",
      "init"
    ],
    "correct_answer": "main",
    "marks": 3,
    "topic": "Flutter",
    "subtopic": "Dart Basics",
    "difficulty": "easy",
    "explanation": "main() is the execution entry point in Dart."
  },
  {
    "id": "div-flutter-fb-2",
    "type": "fill_blanks",
    "question_text": "In Flutter, the ______ widget provides the standard Material design visual layout structure including AppBar, Drawer, and FloatingActionButton.",
    "options": [
      "Scaffold",
      "Container",
      "MaterialApp",
      "Card"
    ],
    "correct_answer": "Scaffold",
    "marks": 3,
    "topic": "Flutter",
    "subtopic": "Material Components",
    "difficulty": "easy",
    "explanation": "Scaffold implements the basic Material Design visual layout structure."
  },
  {
    "id": "div-flutter-fb-3",
    "type": "fill_blanks",
    "question_text": "In a StatefulWidget, calling the ______() method notifies the framework that the internal state has changed and triggers a rebuild.",
    "options": [
      "setState",
      "notifyListeners",
      "markNeedsBuild",
      "update"
    ],
    "correct_answer": "setState",
    "marks": 3,
    "topic": "Flutter",
    "subtopic": "State Management",
    "difficulty": "easy",
    "explanation": "setState() notifies the framework that internal state has changed."
  },
  {
    "id": "div-cyber-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are recognized security risks in the OWASP Top 10? (Select all that apply)",
    "options": [
      "Broken Access Control",
      "Cryptographic Failures",
      "Injection (SQL/Command)",
      "Security Misconfiguration",
      "Fast DOM Rendering"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Cybersecurity",
    "subtopic": "OWASP Top 10",
    "difficulty": "easy",
    "explanation": "Broken Access Control, Cryptographic Failures, Injection, and Security Misconfiguration are leading OWASP risks."
  },
  {
    "id": "div-cyber-mc-2",
    "type": "multiple_correct",
    "question_text": "Which protocols provide end-to-end transport encryption over computer networks? (Select all that apply)",
    "options": [
      "HTTPS",
      "SSH",
      "SFTP",
      "Telnet",
      "HTTP"
    ],
    "correct_answer": [
      0,
      1,
      2
    ],
    "marks": 4,
    "topic": "Cybersecurity",
    "subtopic": "Network Security",
    "difficulty": "easy",
    "explanation": "HTTPS, SSH, and SFTP provide encrypted communication. Telnet and HTTP send plaintext."
  },
  {
    "id": "div-cyber-tf-1",
    "type": "true_false",
    "question_text": "Symmetric key cryptography uses the exact same secret key for both data encryption and decryption.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Cybersecurity",
    "subtopic": "Cryptography",
    "difficulty": "easy",
    "explanation": "Symmetric ciphers (e.g. AES) share a single secret key."
  },
  {
    "id": "div-cyber-tf-2",
    "type": "true_false",
    "question_text": "Using prepared statements with parameterized queries is an effective defense against SQL injection.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Cybersecurity",
    "subtopic": "Web Application Security",
    "difficulty": "easy",
    "explanation": "Parameterized queries separate code from untrusted user data."
  },
  {
    "id": "div-cyber-tf-3",
    "type": "true_false",
    "question_text": "Storing passwords using plain MD5 hashing without salt is considered secure for modern production systems.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Cybersecurity",
    "subtopic": "Authentication & Hashing",
    "difficulty": "easy",
    "explanation": "MD5 is broken and vulnerable to collision and pre-computed rainbow table attacks; bcrypt, Argon2, or PBKDF2 must be used."
  },
  {
    "id": "div-cyber-fb-1",
    "type": "fill_blanks",
    "question_text": "In web security, the browser policy that restricts how a document or script loaded from one origin can interact with a resource from another origin is called the Same-______ Policy.",
    "options": [
      "Origin",
      "Domain",
      "Host",
      "Server"
    ],
    "correct_answer": "Origin",
    "marks": 3,
    "topic": "Cybersecurity",
    "subtopic": "Browser Security",
    "difficulty": "easy",
    "explanation": "Same-Origin Policy (SOP) is a cornerstone web security mechanism."
  },
  {
    "id": "div-cyber-fb-2",
    "type": "fill_blanks",
    "question_text": "The HTTP response header used to prevent Clickjacking attacks by controlling whether a page can be embedded in an <iframe> is X-______-Options.",
    "options": [
      "Frame",
      "XSS",
      "Content",
      "Security"
    ],
    "correct_answer": "Frame",
    "marks": 3,
    "topic": "Cybersecurity",
    "subtopic": "Security Headers",
    "difficulty": "medium",
    "explanation": "X-Frame-Options: DENY or SAMEORIGIN prevents clickjacking."
  },
  {
    "id": "div-cyber-fb-3",
    "type": "fill_blanks",
    "question_text": "In public-key asymmetric cryptography, while the public key is shared freely, the ______ key must always remain secret.",
    "options": [
      "private",
      "symmetric",
      "hash",
      "session"
    ],
    "correct_answer": "private",
    "marks": 3,
    "topic": "Cybersecurity",
    "subtopic": "Cryptography",
    "difficulty": "easy",
    "explanation": "The private key must be kept secret to ensure confidentiality and authenticity."
  },
  {
    "id": "div-uiux-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are part of Jakob Nielsen's 10 Usability Heuristics? (Select all that apply)",
    "options": [
      "Visibility of system status",
      "Match between system and real world",
      "User control and freedom",
      "Consistency and standards",
      "High SQL query throughput"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "UI / UX Design",
    "subtopic": "Heuristic Evaluation",
    "difficulty": "easy",
    "explanation": "These are four of the most fundamental Nielsen heuristics."
  },
  {
    "id": "div-uiux-mc-2",
    "type": "multiple_correct",
    "question_text": "Which color spaces and color formats are natively supported in digital web and screen interfaces? (Select all that apply)",
    "options": [
      "RGB",
      "HEX",
      "HSL",
      "CMYK"
    ],
    "correct_answer": [
      0,
      1,
      2
    ],
    "marks": 4,
    "topic": "UI / UX Design",
    "subtopic": "Color Theory & UI",
    "difficulty": "easy",
    "explanation": "RGB, HEX, and HSL are screen color models. CMYK is primarily for print."
  },
  {
    "id": "div-uiux-tf-1",
    "type": "true_false",
    "question_text": "Low-fidelity wireframes are designed to test page structure, layout, and information architecture before visual polish is added.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "UI / UX Design",
    "subtopic": "Wireframing & Prototyping",
    "difficulty": "easy",
    "explanation": "Low-fidelity wireframes prioritize structure and flow over decorative details."
  },
  {
    "id": "div-uiux-tf-2",
    "type": "true_false",
    "question_text": "Jakob's Law suggests that users expect your application to behave similarly to other applications they already use frequently.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "UI / UX Design",
    "subtopic": "UX Laws & Psychology",
    "difficulty": "easy",
    "explanation": "Jakob's Law emphasizes cognitive familiarity across web interfaces."
  },
  {
    "id": "div-uiux-fb-1",
    "type": "fill_blanks",
    "question_text": "In typography, the vertical distance between lines of text is called line-height or ______.",
    "options": [
      "leading",
      "kerning",
      "tracking",
      "baseline"
    ],
    "correct_answer": "leading",
    "marks": 3,
    "topic": "UI / UX Design",
    "subtopic": "Typography",
    "difficulty": "easy",
    "explanation": "Leading originates from lead strips placed between lines of type."
  },
  {
    "id": "div-uiux-fb-2",
    "type": "fill_blanks",
    "question_text": "In Figma, the feature that allows frames to dynamically resize and adapt to their contents like CSS Flexbox is called ______ Layout.",
    "options": [
      "Auto",
      "Flex",
      "Grid",
      "Smart"
    ],
    "correct_answer": "Auto",
    "marks": 3,
    "topic": "UI / UX Design",
    "subtopic": "Figma Components",
    "difficulty": "easy",
    "explanation": "Auto Layout creates dynamic and responsive components in Figma."
  },
  {
    "id": "div-test-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following are White Box Testing techniques? (Select all that apply)",
    "options": [
      "Statement Coverage",
      "Branch Coverage",
      "Path Coverage",
      "Boundary Value Analysis"
    ],
    "correct_answer": [
      0,
      1,
      2
    ],
    "marks": 4,
    "topic": "Software Testing & C",
    "subtopic": "Testing Methodologies",
    "difficulty": "medium",
    "explanation": "Statement, Branch, and Path coverage inspect internal code paths. BVA is Black Box."
  },
  {
    "id": "div-test-mc-2",
    "type": "multiple_correct",
    "question_text": "Which storage class specifiers exist in the C programming language? (Select all that apply)",
    "options": [
      "auto",
      "register",
      "static",
      "extern",
      "transient"
    ],
    "correct_answer": [
      0,
      1,
      2,
      3
    ],
    "marks": 4,
    "topic": "Software Testing & C",
    "subtopic": "C Fundamentals",
    "difficulty": "medium",
    "explanation": "auto, register, static, and extern are C storage classes. transient is Java."
  },
  {
    "id": "div-test-tf-1",
    "type": "true_false",
    "question_text": "In C, dynamically allocated memory on the heap using malloc() is automatically garbage collected when the pointer goes out of scope.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Software Testing & C",
    "subtopic": "Memory Management",
    "difficulty": "easy",
    "explanation": "C does not have garbage collection; memory allocated via malloc() must be explicitly freed with free()."
  },
  {
    "id": "div-test-tf-2",
    "type": "true_false",
    "question_text": "Regression testing ensures that new bug fixes or features have not adversely affected existing functional software areas.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Software Testing & C",
    "subtopic": "Regression Testing",
    "difficulty": "easy",
    "explanation": "Regression testing prevents software degradation after changes."
  },
  {
    "id": "div-test-fb-1",
    "type": "fill_blanks",
    "question_text": "In C, the unary operator used to retrieve the memory address of a variable is ______.",
    "options": [
      "&",
      "*",
      "->",
      "%"
    ],
    "correct_answer": "&",
    "marks": 3,
    "topic": "Software Testing & C",
    "subtopic": "Pointers & Memory",
    "difficulty": "easy",
    "explanation": "& is the address-of operator in C."
  },
  {
    "id": "div-test-fb-2",
    "type": "fill_blanks",
    "question_text": "The function used in C to dynamically allocate memory on the heap is ______().",
    "options": [
      "malloc",
      "alloc",
      "new",
      "create"
    ],
    "correct_answer": "malloc",
    "marks": 3,
    "topic": "Software Testing & C",
    "subtopic": "Dynamic Allocation",
    "difficulty": "easy",
    "explanation": "malloc() allocates requested bytes of uninitialized memory."
  },
  {
    "id": "div-apt-mc-1",
    "type": "multiple_correct",
    "question_text": "Which of the following numbers are prime numbers? (Select all that apply)",
    "options": [
      "17",
      "21",
      "29",
      "31",
      "35"
    ],
    "correct_answer": [
      0,
      2,
      3
    ],
    "marks": 4,
    "topic": "Aptitude",
    "subtopic": "Quantitative Aptitude",
    "difficulty": "easy",
    "explanation": "17, 29, and 31 are prime. 21 (3x7) and 35 (5x7) are composite."
  },
  {
    "id": "div-apt-mc-2",
    "type": "multiple_correct",
    "question_text": "Which of the following words are direct antonyms of the word \"Meticulous\"? (Select all that apply)",
    "options": [
      "Careless",
      "Sloppy",
      "Negligent",
      "Thorough",
      "Precise"
    ],
    "correct_answer": [
      0,
      1,
      2
    ],
    "marks": 4,
    "topic": "Aptitude",
    "subtopic": "Verbal Ability",
    "difficulty": "medium",
    "explanation": "Meticulous means very careful and precise; Careless, Sloppy, and Negligent are antonyms."
  },
  {
    "id": "div-apt-tf-1",
    "type": "true_false",
    "question_text": "If the price of an item increases by 20% and later decreases by 20%, the final price equals the original initial price.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 1,
    "marks": 2,
    "topic": "Aptitude",
    "subtopic": "Quantitative Aptitude",
    "difficulty": "easy",
    "explanation": "100 -> 120 -> 96. The final price is 4% lower than original."
  },
  {
    "id": "div-apt-tf-2",
    "type": "true_false",
    "question_text": "The average of any set of consecutive integers is always equal to the median of that set.",
    "options": [
      "True",
      "False"
    ],
    "correct_answer": 0,
    "marks": 2,
    "topic": "Aptitude",
    "subtopic": "Quantitative Aptitude",
    "difficulty": "easy",
    "explanation": "In any arithmetic progression, the mean equals the median."
  },
  {
    "id": "div-apt-fb-1",
    "type": "fill_blanks",
    "question_text": "The simple interest on a principal of $1,000 invested at 10% per annum for 3 years is $______.",
    "options": [
      "300",
      "331",
      "250",
      "400"
    ],
    "correct_answer": "300",
    "marks": 3,
    "topic": "Aptitude",
    "subtopic": "Quantitative Aptitude",
    "difficulty": "easy",
    "explanation": "SI = (P * R * T) / 100 = (1000 * 10 * 3) / 100 = $300."
  },
  {
    "id": "div-apt-fb-2",
    "type": "fill_blanks",
    "question_text": "In the formula Speed = Distance / Time, Time = Distance divided by ______.",
    "options": [
      "Speed",
      "Acceleration",
      "Velocity",
      "Mass"
    ],
    "correct_answer": "Speed",
    "marks": 3,
    "topic": "Aptitude",
    "subtopic": "Quantitative Aptitude",
    "difficulty": "easy",
    "explanation": "Time = Distance / Speed."
  },
  {
    "id": "div-code-py-1",
    "type": "coding",
    "coding_language": "python",
    "question_text": "Write a Python function `reverse_words(s)` that takes a string of words and returns the string with word order reversed.",
    "code_snippet": "def reverse_words(s: str) -> str:\n    # Return string with words reversed\n    pass",
    "correct_answer": "def reverse_words(s):\n    return \" \".join(s.strip().split()[::-1])",
    "marks": 10,
    "topic": "Python",
    "subtopic": "Functions & Strings",
    "difficulty": "medium",
    "explanation": "Splitting on whitespace and reversing the word list preserves spacing between tokens."
  },
  {
    "id": "div-code-py-2",
    "type": "coding",
    "coding_language": "python",
    "question_text": "Write a Python function `is_palindrome(text)` that returns True if a given string is a palindrome ignoring case and non-alphanumeric characters.",
    "code_snippet": "def is_palindrome(text: str) -> bool:\n    # Implement palindrome check\n    pass",
    "correct_answer": "def is_palindrome(text):\n    cleaned = \"\".join(c.lower() for c in text if c.isalnum())\n    return cleaned == cleaned[::-1]",
    "marks": 10,
    "topic": "Python",
    "subtopic": "String Manipulation",
    "difficulty": "easy",
    "explanation": "Clean characters with isalnum(), normalize with lower(), and compare with reverse slice."
  },
  {
    "id": "div-code-js-1",
    "type": "coding",
    "coding_language": "javascript",
    "question_text": "Write a JavaScript function `flatten(arr)` that flattens a nested array of arbitrary depth into a single flat array.",
    "code_snippet": "function flatten(arr) {\n  // Return a flattened array\n}",
    "correct_answer": "function flatten(arr) {\n  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);\n}",
    "marks": 10,
    "topic": "JavaScript",
    "subtopic": "Arrays & Recursion",
    "difficulty": "medium",
    "explanation": "Using recursion with reduce or arr.flat(Infinity) flattens nested arrays."
  },
  {
    "id": "div-code-js-2",
    "type": "coding",
    "coding_language": "javascript",
    "question_text": "Write a JavaScript function `twoSum(nums, target)` that returns the indices of the two numbers in `nums` that add up to `target`.",
    "code_snippet": "function twoSum(nums, target) {\n  // Return [index1, index2]\n}",
    "correct_answer": "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}",
    "marks": 10,
    "topic": "JavaScript",
    "subtopic": "Algorithms & Maps",
    "difficulty": "medium",
    "explanation": "A Hash Map achieves O(N) linear time complexity."
  },
  {
    "id": "div-code-java-1",
    "type": "coding",
    "coding_language": "java",
    "question_text": "Write a Java method `int findMax(int[] nums)` that finds and returns the maximum integer in a non-empty array.",
    "code_snippet": "public class Solution {\n    public static int findMax(int[] nums) {\n        // Your code here\n        return 0;\n    }\n}",
    "correct_answer": "public static int findMax(int[] nums) {\n    int max = nums[0];\n    for (int n : nums) if (n > max) max = n;\n    return max;\n}",
    "marks": 10,
    "topic": "Java",
    "subtopic": "Arrays & Logic",
    "difficulty": "easy",
    "explanation": "Traverse the array while tracking the highest encountered element."
  },
  {
    "id": "div-code-sql-1",
    "type": "coding",
    "coding_language": "sql",
    "question_text": "Write a SQL query to select the second highest salary from an Employee table containing columns (id, salary).",
    "code_snippet": "-- Write SQL Query below\nSELECT ... FROM Employee;",
    "correct_answer": "SELECT MAX(salary) AS SecondHighestSalary FROM Employee WHERE salary < (SELECT MAX(salary) FROM Employee);",
    "marks": 10,
    "topic": "Data Science",
    "subtopic": "Database & SQL",
    "difficulty": "medium",
    "explanation": "Subquery filters out top salary, and outer MAX retrieves the second highest."
  }
];
