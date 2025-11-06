Here are two versions of a GitHub description for your "Structured Data Converter" project.

First is the short, one-line "About" description, followed by a full `README.md` file that you can copy and paste.

-----

### 1\. GitHub "About" Description (One-Liner)

A tool built in Google AI Studio that converts natural language prompts into JSON, YAML, CSV, XML, and TOON.

-----

### 2\. Full `README.md` File Content

(You can copy, paste, and save this in a file named `README.md` in your GitHub repository.)

````markdown
 💬 Natural Language to Structured Data Converter

This project is a powerful "Gem" (tool) built for **Google AI Studio**. It takes a simple, natural language request (like "I need a list of three users") and instantly converts it into **five** different structured data formats: JSON, TOON, YAML, CSV, and XML.

It serves as both a practical utility for developers and a clear example of advanced, rules-based prompt engineering for generative AI.

---

## ✨ Key Features

* **Multi-Format Output:** Generates all five formats from a single prompt.
* **Natural Language Input:** No complex syntax required. Just ask for the data you want.
* **Supported Formats:**
    * **JSON:** (JavaScript Object Notation)
    * **TOON:** (Token-Oriented Object Notation)
    * **YAML:** (YAML Ain't Markup Language)
    * **CSV:** (Comma-Separated Values)
    * **XML:** (eXtensible Markup Language)
* **Developer Utility:** Quickly mock up data, create config files, or format data for different APIs.

---

## 🚀 How It Works

The core of this project is a single, detailed prompt used within Google AI Studio. This prompt instructs the AI to act as a "Structured Data Converter" and provides strict rules and examples for each of the five output formats.

### Example Usage

**Input:**
> "Generate a list of 2 products: a 'Laptop' for $1200 and a 'Mouse' for $45."

**Output:**

#### JSON
```json
{
  "products": [
    {
      "name": "Laptop",
      "price": 1200
    },
    {
      "name": "Mouse",
      "price": 45
    }
  ]
}
````

#### TOON

```
products(name, price)
(Laptop, 1200)
(Mouse, 45)
```

#### YAML

```yaml
products:
  - name: Laptop
    price: 1200
  - name: Mouse
    price: 45
```

#### CSV

```csv
name,price
Laptop,1200
Mouse,45
```

#### XML

```xml
<products>
  <product>
    <name>Laptop</name>
    <price>1200</price>
  </product>
  <product>
    <name>Mouse</name>
    <price>45</price>
  </product>
</products>
```

-----

