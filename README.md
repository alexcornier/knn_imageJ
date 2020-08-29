# Classification of images with K-NN

Master's Project, Bio-Computing, University of Bordeaux, 2019-2020

In this project, we are interested in the implementation of the k-Nearest Neighbor (K-NN) classifier algorithm in JavaScript, as a plugin for ImageJ. This is a supervised learning algorithm that can be used for both classification and regression in machine learning with a high level of accuracy according to the configuration.

The principle of this model consists in selecting the data closest to the point studied in order to predict its class. This method doesn’t use any statistical model, it’s “non-parametric” and finally it’s based only on training data. That’s why K-NN is called lazy learner because it does not learn anything in the training period, which makes it faster in comparison with algorithms that require long training. It’s also easy to implement because there are only two parameters needed:

* The value of k corresponding to the k instances of the dataset closed to our observation
* The Euclidean distance corresponding to an interval separating two points in a standardized space

The main purpose is being able to predict the class of a symbol in an image, with a good accuracy, even with some degradation of this image.

## To start

This code was developed using Javascript in order to integrate the functionality as an addin to the ImageJ software.
A good start is reading first the document **[projet_knn.pdf](projet_knn.pdf)** provided in this repository.

### Requirements

The following knowledges and environment are required to run this code:

* ImageJ v1.52s usage is required to understand the automation performed by this code
* IDE, for instance VSCode
* JDK v9.0.4 is mandatory to interoperate well with ImageJ

### Installation

Recommended step by step is:

* Download and install ImageJ
* Download and install JDK v9.0.4
  * Check first any JDK version you would have as this one is mandatory to interoperate with ImageJ
* Download and install the two DataFrame extensions of ImageJ Nashorn_polyfill.js and Tml.js
* Clone the repository
* Run the software ImageJ, and follow the direction provided in the PDF

## Build with

Products below where used to build this application:

* [ImageJ](https://imagej.nih.gov/ij/download.html) - ImageJ
* [Visual Studio Code](https://code.visualstudio.com/docs/languages/markdown) - VS Code with modules Python for the program and markdown to create this README.md
* [JDK 9.0.4](https://www.oracle.com/java/technologies/javase/javase9-archive-downloads.html) - JDK 9.0.4
* [Dataframe extensions](https://github.com/crazybiocomputing/crazytijs/tree/master/t8) - DataFrame extensions of ImageJ Nashorn_polyfill.js and Tml.js

## Versions

Available versions:

* **Last version :** 1.0

## Author

Application developed by:

* **Alexandre Cornier** _alias_ [@alexcornier](https://github.com/alexcornier/)

## License

This project is under ``MIT License`` License - Cf. file [LICENSE.md](LICENSE.md) for any further details.
