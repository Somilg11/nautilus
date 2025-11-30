# Nautilus 🐚

**The Ultimate Open-Source System Design & Architecture Visualization Tool.**

![Nautilus Banner](https://images.unsplash.com/photo-1614726365723-49cfae92782f?q=80&w=2669&auto=format&fit=crop)

> **"One of its kind. Free for everyone. Built for the community."**

Nautilus is a powerful, agentic-ready diagramming tool designed for software architects, developers, and system designers. It combines the flexibility of a canvas with the intelligence of AI to help you visualize, plan, and document complex systems with ease.

## 🚀 Features

-   **AI-Powered Generation**: Generate complete system architectures from text prompts using OpenAI, Gemini, Claude, or Groq.
-   **Smart Templates**: Jumpstart your design with production-grade templates for Netflix, Uber, WhatsApp, and more.
-   **Rich Component Library**: Drag and drop hundreds of specialized icons for Cloud, DevOps, Databases, and more.
-   **Intelligent Toolbar**: Group, align, distribute, and manage your nodes with precision tools.
-   **Open Format**: Export and import your designs as simple JSON.
-   **Dark Mode**: Sleek, modern interface optimized for long coding sessions.

## 🛠️ Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Somilg11/nautilus.git
    cd nautilus
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run the development server**:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤝 How to Contribute

We believe that great tools are built by great communities. Nautilus is 100% open-source and we welcome contributions of all kinds!

### Contributing Templates

Want to add a new architecture pattern?
1.  Navigate to `src/lib/templates/`.
2.  Create a new file (e.g., `my-awesome-arch.ts`).
3.  Follow the standard template structure:
    ```typescript
    export const MyTemplate = {
      id: "my-arch",
      name: "My Awesome Architecture",
      description: "A brief description...",
      nodes: [ ... ],
      edges: [ ... ]
    }
    ```
4.  Register it in `src/lib/templates/index.ts`.
5.  Submit a Pull Request!

### Reporting Issues

Found a bug? Have a feature request? Open an issue on our [GitHub Issues](https://github.com/Somilg11/nautilus/issues) page.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the Open Source Community.**
