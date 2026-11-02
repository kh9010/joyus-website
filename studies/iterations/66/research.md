# Why rendered metal looks like cheap plastic

Researched 2 Nov 2026 for Study 66. The ranking and the "try" numbers are judgement: no source ranks the causes or gives satin roughness values. Forum and vendor pages are single opinions.

## What was tried, in order

1. **Stop clipping the metal.** Overexposed metal reads as plastic: [The Slanted Lens](https://theslantedlens.com/2023/how-to-photograph-shiny-metal-lighting-tutorial/?amp=1).
2. **Put dark in the reflections.** Mostly white reflections look washed out: [McNeel forum](https://discourse.mcneel.com/t/looking-for-render-help-for-jewelry/54454). Black cards shape metal: The Slanted Lens, above.
3. **Gradients, not hard strips.** Gradient control makes glossy products look more luxurious: [Visual Education](https://visualeducation.com/class/gradient-light-for-products/). Even all-round reflections look flat: [CML](https://cinematography.net/Lessons/Pack-Lighting.html). (A PetaPixel page on gradient length was read only as a search summary.)
4. **Change the finish.** Caustic etching gives satin by irregular micro-dissolving: [patent 6588085](https://patents.justia.com/patent/6588085). Bead blasting also gives a satin sheen: [vendor](https://attackshark.com/blogs/knowledges/bead-blasting-sandblasting-metal-gaming-peripherals). Vacuum metallising is a thin metal layer with a top coat that controls colour, including gold: [vendor](https://www.rapid-protos.com/what-is-vacuum-metalizing/). Coat tint saturates with angle: [Blender PR](https://projects.blender.org/blender/blender/pulls/112848).
5. **Colour matters least.** Our base (1, .766, .336) already sits near measured gold: [physicallybased.info](https://physicallybased.info/) gives (1.059, .773, .307), column not confirmed; [Adobe's table](https://helpx.adobe.com/substance-3d-general/adobe-standard-material/metal-material-references.html) returned 403 and was read only as a search snippet.

## What the renders showed

Measured on the hair oil's collar, share of pixels near white on all channels: as it was 8.0%; every other version 0.0%. Changing what the metal reflects did that, before any change to the metal.

The look of the satin is a judgement by eye. Roughness .33 to .36 was chosen by testing; .30 to .38 looked blotchy.

## Could not source

Roughness ranges for satin or brushed metal; Ra or gloss data for cosmetics gold; dust, fingerprints or scratches as a fix (Study 64 tried them and they barely showed); any measured spectrum for plated or lacquered gold.
