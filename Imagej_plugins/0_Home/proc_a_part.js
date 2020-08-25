/*
Process the current image in Imagej with Analyze Particles
This script is to be used as a plugin in ImageJ
Can be use alone or called by the main k_NN_js script
Process:
- convert to 8 bit
- invert
- resize to 1000x700
- set threshold to Otsu dark
- set measurements
- analyze particles to get results

Alexandre Cornier - Jan. 2020
*/

// Instance current image
let imp = IJ.getImage();

// Convert to Gray 8-bit
IJ.run(imp, "8-bit", "" );

// Invert
IJ.run(imp, "Invert", "" );

// Increase canvas size
IJ.run(imp, "Canvas Size...", "width=1000 height=700 position=Center zero");

// Set Threshold
IJ.setAutoThreshold(imp, "Otsu dark");

// Set Measurements
IJ.run(imp, "Set Measurements...", "area centroid shape redirect=None decimal=3");

// Analyze particles
IJ.run(imp, "Analyze Particles...", "  show=Outlines display");
