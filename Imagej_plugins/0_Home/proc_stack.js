/*
Process the current image in Imagej with Montage to Stack
This script is to be used as a plugin in ImageJ
Can be use alone or called by the main k_NN_js script
Process:
- convert to 8 bit
- ask for a Noise Standard Deviation, if entered
  - divide by 2 the pixels intensity
  - ask for a number of cycle to apply the std deviation
  - apply n times the std deviation
- set measurements
- run the montage to stack
- measure stack to get results

Alexandre Cornier - Jan. 2020
*/

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

// Set Measurements
IJ.run(imp, "Set Measurements...", "area mean min centroid shape redirect=None decimal=3");

// Create stack from image
IJ.run(imp, "Montage to Stack...", "columns=32 rows=32 border=0");

// Instance the stack
let stack = IJ.getImage();

// Get results
IJ.run(stack, "Measure Stack...", "");
