# AI-Powered Customer Intelligence for Smarter Marketing

> 💡 **Note for the team:** This is just a template. Update the above title with your AI Studio Challenge Project name. Remove all guidance notes and example text in this template and populate this README with your own content. You can work on this README throughout AI Studio, and get feedback from your AI Studio Coach and Challenge Advisor before finalizing it.  

---

### 👥 **Team Members** Alexis Chan, Donald Reith, Esther Li, Garima Thapa, Karen Mai, Sarah Fitz

| Name             | GitHub Handle               | Contribution  (as of September)                                          |
|------------------|-----------------------------|--------------------------------------------------------------------------|
| Alexis Chan      | @alexisc413                 | Business Understanding                                                   |
| Donald Reith     | @bananadonn                 | Integration & Validation                                                 |
| Esther Li        | @esther-h-li                | Data Visualization                                                       |
| Garima Thapa     | @garimathapa2248-star       | Data Exploration                                                         |
| Karen Mai        | @kmai118                    | Data Cleaning                                                            |
| Sarah Fitz       | @sarah-yiyang               | Customer Feature Engineering                                             |

---

## 🎯 **Project Highlights**

**Example:**

- Developed a machine learning model using `[model type/technique]` to address `[challenge project task]`.
- Achieved `[key metric or result]`, demonstrating `[value or impact]` for `[host company]`.
- Generated actionable insights to inform business decisions at `[host company or stakeholders]`.
- Implemented `[specific methodology]` to address industry constraints or expectations.

---

## 👩🏽‍💻 **Setup and Installation**

**Provide step-by-step instructions so someone else can run your code and reproduce your results. Depending on your setup, include:**

* How to clone the repository
* How to install dependencies
* How to set up the environment
* How to access the dataset(s)
* How to run the notebook or scripts

---

## 🏗️ **Project Overview**

This project is part of the Fall 2026 Break Through Tech AI Studio program, where we are applying AI and machine learning techniques to a real-world business challenge in collaboration with our AI Studio host company, Witomni.

Witomni helps founder-led companies grow through AI-powered marketing initiatives, from strategy to campaign execution. The objective of our project is to use publicly available e-commerce transaction data to build a classification model that predicts which customers are most likely to become repeat purchasers. Our scope includes exploring and cleaning the transaction data, engineering customer-level features such as purchase frequency, recency, and average order value, developing and comparing classification models, and evaluating their performance using metrics such as precision, recall, F1-score, and ROC-AUC.

The problem has real-world significance because understanding which customers are likely to make additional purchases can help businesses better target their marketing efforts and develop customer retention strategies. Our work aims to turn transaction history into actionable customer insights that can support more informed marketing decisions and help identify high-value customer segments.

---

## 📊 **Data Exploration**

## Dataset
**Name and Source:** Online Retail Dataset (Publicly available)  
**Format:** CSV / Structured tabular data  
**Size:** under 1gb  
**Location:** https://archive.ics.uci.edu/dataset/352/online+retail

### Key Details
- This is a transactional data set which contains all the transactions occurring between 01/12/2010 and 09/12/2011 for a UK-based and registered non-store online retail. The company mainly sells unique all-occasion gifts. Many customers of the company are wholesalers.

### Key Variables
- `InvoiceNo`: Invoice number. Nominal, a 6-digit integral number uniquely assigned to each transaction. If this code starts with letter 'c', it indicates a cancellation.
- `StockCode`: Product (item) code. Nominal, a 5-digit integral number uniquely assigned to each distinct product.
- `Description`: Product (item) name. Nominal.
- `Quantity`: The quantities of each product (item) per transaction. Numeric.
- `InvoiceDate`: Invoice Date and time. Numeric, the day and time when each transaction was generated.
- `UnitPrice`: Unit price. Numeric, Product price per unit in sterling.
- `CustomerID`: Customer number. Nominal, a 5-digit integral number uniquely assigned to each customer.
- `Country`: Country name. Nominal, the name of the country where each customer resides.


**Potential visualizations to include:**

* Plots, charts, heatmaps, feature visualizations, sample dataset images [to be included]

---

## 🧠 **Model Development**

**You might consider describing the following (as applicable):**

* Model(s) used (e.g., CNN with transfer learning, regression models)
* Feature selection and Hyperparameter tuning strategies
* Training setup (e.g., % of data for training/validation, evaluation metric, baseline performance)


---

## 📈 **Results & Key Findings**

**You might consider describing the following (as applicable):**

* Performance metrics (e.g., Accuracy, F1 score, RMSE)
* How your model performed
* Insights from evaluating model fairness

**Potential visualizations to include:**

* Confusion matrix, precision-recall curve, feature importance plot, prediction distribution, outputs from fairness or explainability tools

---

## 🚀 **Next Steps**

**You might consider addressing the following (as applicable):**

* What are some of the limitations of your model?
* What would you do differently with more time/resources?
* What additional datasets or techniques would you explore?

---

## 📝 **License**

Specify how your project can be used by others. Choose an appropriate license and link it here (e.g., MIT, Apache 2.0). Make sure your Challenge Advisor approves of the selected license type. 

**Example:**
This project is licensed under the MIT License.

---

## 📄 **References**

- Original Dataset Paper
Chen, D., Sain, S. L., & Guo, K. (2012). [Data mining for the online retail industry: A case study of RFM model-based customer segmentation using data mining.](https://www.semanticscholar.org/paper/Data-mining-for-the-online-retail-industry%3A-A-case-Chen-Sain/e43a5a90fa33d419df42e485099f8f08badf2149)
- Kumar, N. (2025). [Intelligent customer segmentation: unveiling consumer patterns with machine learning](https://link.springer.com/article/10.1007/s43995-025-00180-7)
- S. Arefin et al. (2024), [Retail Industry Analytics: Unraveling Consumer Behavior through RFM Segmentation and Machine Learning](https://ieeexplore.ieee.org/document/10609927) 
- https://github.com/MinoshPerera/Online-Retail-RFM-Customer-Segmentation

---

## 🙏 **Acknowledgements** (Optional but encouraged)

Thank your Challenge Advisor, host company representatives, TA, and others who supported your project.
