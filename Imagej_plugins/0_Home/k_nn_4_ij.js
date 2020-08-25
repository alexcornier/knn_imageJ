/*
k-NN algorithm for ImageJ
This program can use either analyze particule or montage to stack process
main steps are:
  -preparation of the Data with ImageJ
  -training (fit)
  -testing
  -accuracy measurement
  -exploitation (using stack images to predict)
requirements:
  -ImageJ v1.52s, Java SDK 9.0.4
external js scripts as plugin:
  -proc_stack.js, proc_a_part.js
  -
Alexandre Cornier - Jan. 2020
*/

// Import helper functions (used for instance for DataFrame() and console.log())
const IJ_PLUGINS = IJ.getDir('plugins');
load(`${IJ_PLUGINS}/javascript/nashorn_polyfill.js`);
load(`${IJ_PLUGINS}/javascript/tml.js`);

/*---------------------------------------------------------------------------
Set Global const and var
----------------------------------------------------------------------------*/

// Set the 4 DataFrames needed for Training & Test with Data & Labels
const df_train_data = [];
const df_train_label = [];
const df_test_data = [];
const df_test_label = [];

// Set the subdirectory hosting proc_a_part.js & proc_stack.js plugins
const pluginsHome = "/0_Home/";

/*---------------------------------------------------------------------------
Functions
----------------------------------------------------------------------------*/

/*
Create the 4 Dataframes needed from the loaded dataset
Argument:
- dataset: array of arays containing all the Data inclusing Labels
Return nothing but fillin the 4 df_* const with the appropriate Data
----------------------------------------------------------------------------*/
function createdf(label, dataset) {
  // Check lenght of both arrays for equality
  
  if (label.length != dataset.length) {
    console.log("ERROR: both tables for labels and data don't have the same size: label=" + label.length + ", data=" + dataset.length);
  }
  
  // Use first half of the data for training
  // Math.trunc is not supported by ImageJ so Math.floor is used instead
  let isplit = Math.floor(dataset.length / 2);
  
  for (let i = 0; i <= isplit; i++) {
    df_train_data.push([dataset[i]]);
    df_train_label.push(label[i]);
  }
  isplit = isplit + 1;
  // Use second half of the data for testing
  for (i = isplit; i < dataset.length; i++) {
    df_test_data.push([dataset[i]]);
    df_test_label.push(label[i]);
  }
}

/*
Get Euclidean distance between two points
Arguments:
- first point: coordintates as array
- Second point: coordinates as array
Return distance or -1 if the two points don't have the same dimension
----------------------------------------------------------------------------*/
function distance(a, b) {
    let total = 0, diff = 0, fDist = 0;
    if (a.length != b.length) {
      console.log("ERROR: Distance - both points don't have the same dimension")
      console.log(a);
      console.log(b);
      return -1;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] > b[i]) {
            diff = a[i] - b[i];
          } else {
            diff = b[i] - a[i];
          }
        total += diff * diff;
    }
    fDist = Math.sqrt(total);
    return fDist;
}

/*
Get the most common value found in an array
Argument:
- arrLabel: array of values
Return one single value that is the most common label 
----------------------------------------------------------------------------*/
function modeArray(arrLabel) {
  let most_freq = 1;
  let icount = 0;
  let label = arrLabel[0];
  for (let i = 0; i< arrLabel.length; i++) {
    for (let j = i; j< arrLabel.length; j++) {
      if (arrLabel[i] == arrLabel[j]) {
        icount++;
      }
      if (most_freq < icount) {
        most_freq = icount; 
        label = arrLabel[i];
      }
    }
    m=0;
  }
  return label;
}

/*
Build the table of results with the selected features from a DataFrame
Argument:
- df: DataFram from ImageJ Results
- ft_str: CSV String containing selected features separated by comma
Return an array with Measurements in Row and features in Columns 
----------------------------------------------------------------------------*/
function buildResults(df, ft_str) {
  let features = ft_str.split(",");

  // Create the new Dataset with selected columns (features)
  let data_arr = [];
  if (features.length < 2) {
      // Case of one single feature, no need to combine columns
      let df_single = new DataFrame();
      df_single = df.select(features[0]);
      data_arr = df_single.array();
  } else {
      // Case of multiple features
      let df2 = [];
      let df2_arr = [];
      // Get the columns corresponding to features selected
      for (let f = 0; f < features.length; f++) {
          df2[f] = df.select(features[f]);
          df2_arr[f] = df2[f].array();
      }

      // Create new rows and push them in the final table
      for (let i = 0; i < df2_arr[0].length; i++) {
          let arr_temp = [];
          for (let j = 0; j < features.length; j++) {
              arr_temp.push(df2_arr[j][i]);
          }
          data_arr.push(arr_temp);
      }
  }

  return data_arr;
}

/*
createKNN - main "Class" containing the fit and predict functions
Argument:
- k: number of closest neighbors
----------------------------------------------------------------------------*/
function createKNN(k) {
  this.k = k; // number of neighbors to consider
  this.prediction = []; // array of labels predicted using the test Data
  /*
  initialize DataFrame for Training
  Arguments:
  - df: DataFrame containing the Data
  - labels: array of numbers containing the labels of the observations in df
  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
  this.fit = function(df, labels) {
    this.x_train = df;
    this.y_train = labels;
  }

  /*
  predict Labels
  Argument:
  - df: DataFrame of unlabeled test Data
  Return an array of predicted Labels
  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
  this.predict = function(df) {
    for(let i = 0; i < df.length; i++) {
      let k_labels = this.closest(df[i]);
      let label = modeArray(k_labels);
      this.prediction.push(label);
    }
  }

  /*
  Get closest neighbors
  Arguments:
  - row: data to evaluate
  Return an array of k labels from closest neighbors
  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
  this.closest = function(row) {
    let dist = 0;
    let best_dist = [], best_index = [], k_labels = [];
    // set arrays of resulting distances & indexes
    for(let n = 0; n < this.k; n++) {
      best_dist.push(distance(row, this.x_train[0]));
      best_index.push(0);
      k_labels.push(0);
    }
    // compute distance with each row in training Dataframe
    for(let i = 0; i < this.x_train.length; i++) {
      dist =  distance(row, this.x_train[i]);
      // record and sort the distance - if shorter - in array of results
      for(n = 0; n < this.k; n++) {
        if (dist < best_dist[n]) {
          best_dist[n] = dist; // new best distance as result
          best_index[n] = i; // corresponding index into the training Dataframe
          break;
        }
      }
    }
    //get array of labels for closest neighbors
    for(let n = 0; n < this.k; n++) {
      k_labels[n] = this.y_train[best_index[n]];
    }
    return k_labels;
  }

  /*
  Get accuracy of prediction
  Arguments:
  - test_labels: array of known Labels for the test DataFrame
  Return percentage of accuracy in a range[0..1]
  = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = */
  this.accuracy = function(test_labels) {
    let label_match = 0, acc_percentage = 0;
    if (test_labels.length != this.prediction.length) {
      console.log("ERROR: Prediction and Test tables don't have the same length.")
      acc_percentage = -1;
    } else {
      for (let i = 0; i < test_labels.length; i++) {
        if (test_labels[i] == this.prediction[i]) {
          label_match++;
        }
      }
      acc_percentage = label_match / test_labels.length;
    }
    return acc_percentage;
  }
}

/*---------------------------------------------------------------------------
Core algorithm - ImageJ - Image preparation & Measurement
----------------------------------------------------------------------------*/

// Get the image fullpath from a dialog box
let path = IJ.getFilePath("Select the image to open");

// Open image
let image = IJ.openImage(path);
image.show("Image"); // display it

// Get the CSV file fullpath containing labels from a dialog box
path = IJ.getFilePath("Select the CSV file containing the labels for this image");

// Open file
let CSV_labels = ResultsTable.open(path);
CSV_labels.show("Results");

// Load DataFrame from the Result Window
let table = ResultsTable.getResultsTable();
let df_label = new DataFrame();
df_label.fromIJ(table);

// Close the Result Window used to load the CSV Labels
IJ.selectWindow("Results"); 
IJ.run("Close");

// Create an array containing the Labels and load the Data from the DataFrame
let label_arr = df_label.column('Label').array();

// Get the process to apply, to choose between image to stack and analyze particles
let iprocess = IJ.getNumber("ImageJ process to apply to the image: 1 for analyze particles, 2 for montage to stack, ", 1);

// Get the plugin directory
let plugin_path = IJ.getDirectory("plugins");
let plugin = "";

// Run the selected process script
if (iprocess == 1) {
  // Case of Shapes measured using Analyze Particles
  plugin = plugin_path + pluginsHome + "proc_a_part.js"
  IJ.runMacroFile(plugin);
} else if (iprocess == 2) {
  // Case of Circles measured using Montage to Stack
  plugin = plugin_path + pluginsHome + "proc_stack.js"
  IJ.runMacroFile(plugin);
}

// Load DataFrame from the Result Window after Measurement
let table_results = ResultsTable.getResultsTable();
let df_results = new DataFrame();
df_results.fromIJ(table_results);

// Get the features to use
let q_str = df_results.headings;
let features_str = IJ.getString("Select the features to use for the k-NN", q_str);

// Build the target Dataset containing only selected features
let results_arr = buildResults(df_results, features_str);

/*---------------------------------------------------------------------------
Core algorithm of k-NN using values [1..20] for k
----------------------------------------------------------------------------*/

// Create the 4 DataFrames for train & Test with Data & Labels in distincts arrays
createdf(label_arr, results_arr);

let faccuracy = 0;
for (let k = 1; k < 21; k++) {

  // Create the k-NN object
  let classifier = new createKNN(k);

  // Load the Data & Labels for the training into the k-NN object
  classifier.fit(df_train_data, df_train_label);

  // Predict Labels using test Data (without providing Labels)
  classifier.predict(df_test_data);
  
  //Measure accuracy by comparing test & predicted labels
  faccuracy = classifier.accuracy(df_test_label);
  console.log(faccuracy);
}

/*---------------------------------------------------------------------------
Exploitation of the k-NN to predict labels of symbols
----------------------------------------------------------------------------*/

// Get answer for predicting an image or not
let bpredict = IJ.getString("Do you want to predict the label for an image? (Y or N)", "Y");

if (bpredict == "Y") {
  // Close the Stack window
  IJ.selectWindow("Stack"); 
  IJ.run("Close");

  do {
    // Close the Result window
    IJ.selectWindow("Results"); 
    IJ.run("Close");
  
    // Get the image fullpath from a dialog box
    let path_img = IJ.getFilePath("Select the image to open for prediction");

    // Open image
    let img_test = IJ.openImage(path_img);
    img_test.show("Img_test");

    // Instance current image
    let imp = IJ.getImage();

    // Convert to Gray 8-bit
    IJ.run(imp, "8-bit", "" );

    // Get noise level to apply
    let fnoise = IJ.getNumber("Standard deviation level of Noise to apply, 0 for no Noise", 0);

    // Add noise if the deviation entered is > 0
    if (fnoise > 0) {
      // Get the number of cycles to apply Noise
      let fnb = IJ.getNumber("Number of cycles to apply Noise", 1);

      // Divide by 2 the pixels intensity
      IJ.run(imp, "Divide...", "value=2");

      // Cycle noise
      let std_noise = "standard=" + fnoise;
      for (let i = 0; i < fnb; i++) {
        IJ.run(imp, "Add Specified Noise...", std_noise);
      }
    }

    //Set Measurements
    IJ.run(imp, "Set Measurements...", "area mean min centroid shape redirect=None decimal=3");
    
    // Get results
    IJ.run(imp, "Measure Stack...", "");

    // stop the console.info to not confuse the logs with the Columns loaded in DataFrame from Results
    let consoleOrg = console.info;
    console.info = function () {};

    // Load DataFrame from the Result Window after Measurement
    table_results = ResultsTable.getResultsTable();
    df_results = new DataFrame();
    df_results.fromIJ(table_results);

    // Reactivate the console.info
    console.info = consoleOrg;

    // Build the Dataset containing only selected features
    let results_arr = [];
    results_arr.push([buildResults(df_results, features_str)]);

    // Get the number of nearst neighbors for the k-NN
    let k = IJ.getNumber("How many neighbors for the k-NN?", 1);

    // Create the k-NN object
    let classifier = new createKNN(k);

    // Load the Data & Labels for the training into the k-NN object
    classifier.fit(df_train_data, df_train_label);

    // Predict Labels using test Data (without providing Labels)
    classifier.predict(results_arr);
    console.log("k value = " + k + ", Features used: " + features_str);
    console.log("Symbol " + results_arr + " is of type: " + classifier.prediction);

    // Get answer for predicting another image or not
    bpredict = IJ.getString("Do you want to predict the label for another image? (Y or N)", "Y");

    // Close the previous image
    imp.close();

  } while (bpredict == "Y");
}

// Close images and results windows to clean up
IJ.run("Close All");
IJ.selectWindow("Results"); 
IJ.run("Close");

//-------------------------------- END --------------------------------------