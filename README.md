# Statistics & Data Analysis

A local browser app for calculations usually done in Excel for Statistics and Data Analysis coursework. Each calculator shows results alongside the Excel function or method used.

## Run the app

Open `index.html` in a browser. It runs offline and needs no installation. Each calculator starts with an example. Replace the inputs with your own data and click the calculate button. Select **Comma** for numbers such as `3,14` and **Point** for `3.14`. The app calculates in your browser and keeps inputs for the current page session.

| Calculator | Inputs and outputs |
| --- | --- |
| Descriptive statistics | Paste one numeric column. Get count, mean, median, modes, min/max, range, midrange, sample and population variance and standard deviation, quartiles, IQR, and outliers. |
| Binomial probability | Enter the trial count, success probability, and event. Supports exact counts, strict and inclusive tails, and inclusive ranges, with up to 100,000 trials. |
| Simple linear regression | Paste two adjacent numeric columns, X followed by Y. Get the least-squares slope and intercept, Pearson r, R², and optional predicted Y. |

Paste numeric cells without headers or thousands separators. For regression, preserve the two-column layout and include both values in every row. Results display up to 10 significant digits.

## Work across PCs and chats

Clone the [private GitHub repository](https://github.com/Ragaton/statistics-data-analysis) on the other PC while signed in as `Ragaton`. In GitHub Desktop, use **Clone repository** and select `Ragaton/statistics-data-analysis`. Then open `index.html` in the cloned folder.

Pull the latest changes before starting work. Commit and push completed changes so they are available on both PCs. For a new Codex chat, open the cloned folder as a project and point the chat to this README and [the course formula notes](COURSE-FORMULAS.md). For independent changes, start a branch from the latest `main`.

## Develop and verify

`statistics.js` holds the calculation and paste-parsing functions. `app.js` connects forms to the formulas. `index.html` and `styles.css` define the interface.

With Node.js installed, run `node --test statistics.test.js` to check example calculations and edge cases.

When adding a course calculation, record the method and provide a small dataset or inputs, the expected Excel formula or result, and any course-specific convention such as significance level, tail direction, or quartile method.
