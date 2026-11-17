# Course formula notes

The course outline below is based on the two supplied one-page reference sheets, `A4_NotePaperFromHell_v3.pdf` and `A_MyOwnStatistikPaper.pdf`. The PDFs are kept local. This file records the conventions and development status needed to continue the project across chats.

| Course topic | App status |
| --- | --- |
| Data types and study design | Course concepts for interpreting calculator inputs and results. |
| Descriptive statistics | Count, location and dispersion, quartiles, IQR, and outliers implemented. Arbitrary percentiles, frequency tables, skewness, kurtosis, histograms, and boxplots remain candidates. |
| Probability | Exact and cumulative binomial events implemented. Classical and empirical probability and normal distribution calculations are pending. |
| Inference | One-sample and paired t-tests, one-sample mean confidence intervals, and independent t-tests are pending. |
| ANOVA | One-way ANOVA, Fisher’s LSD comparisons, and two-way ANOVA with interaction are pending. The notes use two levels per factor for the two-way examples. |
| Regression | Simple least-squares fit, Pearson r, R², and point prediction implemented. Correlation significance, residual diagnostics, intervals, and multiple regression are pending. |

## Implemented conventions

- **Variance and standard deviation.** Sample variance divides the squared deviations by n − 1. Population variance divides by n. Standard deviation takes the square root of the corresponding variance. The sample quantities require at least two observations. [Excel statistical functions](https://support.microsoft.com/en-us/excel/statistical-functions-reference)
- **Quartiles.** The default follows Excel `QUARTILE.INC` with linear interpolation at zero-based rank (n − 1)p. This matches R’s default type-7 quantile. The app also offers median of halves, which excludes the overall median for odd sample sizes and requires at least two observations. The 1.5 × IQR fences use the selected quartile method. [Excel PERCENTILE.INC](https://support.microsoft.com/en-us/excel/functions/percentile-inc-function), [R sample quantiles](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/quantile.html)
- **Binomial events.** Between is inclusive. Fewer than k ends at k − 1 and more than k starts at k + 1. The calculation sums the requested range directly to preserve accuracy for small tail probabilities. [Excel BINOM.DIST.RANGE](https://support.microsoft.com/en-us/excel/functions/binom-dist-range-function)
- **Regression.** The app fits Y as a function of X with an intercept. Correlation and its square are undefined when Y is constant. A prediction outside the observed X values is flagged as extrapolation. [Excel statistical functions](https://support.microsoft.com/en-us/excel/statistical-functions-reference)

## Conventions to confirm against course examples

- Both reference sheets show a pooled-variance independent t-test and also give the R command `t.test(x1, x2)`, which defaults to Welch’s unequal-variance test. Confirm the expected test for each exercise. [R t-test documentation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/t.test.html)
- In hypothesis-test output, use “fail to reject H₀” when the p-value exceeds the significance level. For Shapiro–Wilk, that outcome means the test found insufficient evidence against normality.
- Some exercises may ask for the percentile rank of a given value. That calculation starts from a value and returns a proportion. A percentile or quartile starts from a proportion and returns an estimated value.
