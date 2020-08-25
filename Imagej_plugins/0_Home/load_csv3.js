// Import helper functions (used for instance for DataFrame() and console.log())
const IJ_PLUGINS = IJ.getDir('plugins');
load(`${IJ_PLUGINS}/javascript/nashorn_polyfill.js`);
load(`${IJ_PLUGINS}/javascript/tml.js`);

// Get the file fullpath containing labels from a dialog box
path = IJ.getFilePath("Select the CSV file containing the labels for this image");

// Open File
let CSV_labels = ResultsTable.open(path);
CSV_labels.show("Results");

// Load DataFrame from the Result Window
let table = ResultsTable.getResultsTable();
let df = new DataFrame();
df.fromIJ(table);

// Close the Result Window used to load the CSV Labels
IJ.selectWindow("Results"); 
IJ.run("Close");

let q_str = df.headings;

// Get the features to use
features_str = IJ.getString("Select the features to use for the k-NN", q_str);
//console.log("String cateched: " + features);
//console.log("Value of String: " + features.valueOf());

let features = features_str.split(",");
console.log(features);

//let features = ["Mean","Min"]
//console.log(features);

let data_arr = [];
if (features.length < 2) {
    // Case of one single feature, no need to combine columns
    let df_single = new DataFrame();
    df_single = df.select(features[0]);
    data_arr = df_single.array();
} else {
    // Case of multiple columns
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

let df_test = df.select("Mean");
let df_test_arr = df_test.array();

console.log(df_test_arr);
console.log (data_arr);

/*
let df2_arr = df2.array();
let df3_arr = df3.array();

let data_arr = [];
data_arr.push(df2_arr, df3_arr);
*/

/*
let df2_arr = [];
let df3_arr = [];

df2_arr.push([df2.array()]);
df3_arr.push([df3.array()]);
*/

//let data_arr = df2_arr.concat(df3_arr);

//let data_arr = [...df2_arr, ...df3_arr];

//let df2 = df.select(features.valueOf());
//let df2 = df.select("Mean","Min");

//features_arr = ["Mean","Min"];
//console.log(features_arr);
//let df2 = df.select(features_arr);

//console.log("Columns in DataFrame: " + df2.headings);
//console.log(df2.array());

//let test_arr = df.array();

//console.log(label_arr);

//console.log(label_arr[2]);

// let area = df.column('Area'); // Return DataFrame
// let area_array = area.array(); // Convertit en tableau
// let row = df.row(0).array(); // pour une ligne