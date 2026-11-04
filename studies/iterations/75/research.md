# Product visualization in Blender: what the tutorials say

Read 4 November 2026 after Divya: "I think you are not getting some fundamental things right." I read transcripts, not pictures: I could not watch the videos. X would not open (HTTP 402), so posts are known only from search snippets.

## The fundamentals, and what I was doing

| Fundamental | Source | What I was doing |
|---|---|---|
| Lighting something reflective "is all about the environment", not what light falls on it | [Quick Blender Tip 18](https://www.youtube.com/watch?v=CLlNnTgC6KI) | Adding lights, then a gradient dome hidden from everything but reflections (Study 66) |
| Three-point lighting is the named beginner mistake for glass: "doesn't work in our case" | Tip 18 | Study 62 was literally three-point, at her request for key and fill; I should have said |
| Don't use default lights on glossy things. Emission planes with a gradient texture and colour ramp; a plain card gives a "harsh" hard line | Tip 18; [Tip 20](https://www.youtube.com/watch?v=9KZnlJU1_-M); [Fox Renderfarm](https://foxrenderfarm.com/news/realistic-product-lighting-in-blender) | Area lights and a hidden dome |
| Flags: black cards, just out of frame, make the "beautiful defined edge" of the glass | Tip 18, Tip 20 | Had them in 62-64 but hid them from the metal, then removed them in 71 as "dreary". I took out what defines glass |
| A large bright plane behind is backdrop and backlight at once. Small ones leave dark spots in the glass | Tip 20; [Interactiv](https://www.youtube.com/watch?v=Fg-upr4yWkA) | Bright world and sweep with an emission lift. Nothing lit the glass from behind |
| Pure white look: a black, near-mirror floor (black acrylic in a real studio) reflecting a white backdrop. "Everything you see on this surface... it's reflecting the background" | Tip 18, Tip 20 | White paper with emission added, and upside-down bottles under a sheet for a mirror |
| Backdrop must be wide: anything missing reflects as black in the bottle's edge | Tip 20 | Not considered |
| Common issue: people over-light the scene | Tip 20 | Yes: I blew out stones and labels more than once |
| Lower camera, long lens, looking slightly up: 120 mm in Interactiv's; 50-100 mm generally | Interactiv; [UFO3D](https://ufo3d.com/photorealistic-rendering/) | 85 mm, often high and looking down |
| Real caustics: filter glossy to 0, raise transmission bounces and the indirect clamp | Interactiv | Faked by tinting shadow rays |
| Materials first for glass, then light; lights adjust to them | Interactiv | Lit first |
| A label is a material: mix shader on the art, metallic foil in the ink, paper normal, bump from the art. "Your textures are being removed by denoise": use close-ups and more resolution | Interactiv | One image on one principled |
| Droplets: points on a masked area → point to volume → volume to mesh, random radii, so they merge. Plain glass shader: roughness 0, transmission 1 | [Soda can](https://www.youtube.com/watch?v=ga8YoGiSiMY); [Joey Carlino via BlenderNation](https://www.blendernation.com/2022/07/07/creating-water-droplets-with-geometry-nodes/) | Separate spherical caps |
| Bevel every edge; roughness varies; wear only where hands go; texture at true scale; manufacturing marks; a contact shadow; post is the last 10% | UFO3D | Partly. Bevels from profiles; little wear; no post |
| Tone mapping so highlights roll off | UFO3D (ACES). Sources disagree: [a forum thread](https://blenderartists.org/t/how-do-they-achieve-this-style/1615675) prefers Standard | Standard, because Filmic greyed her label's type in Study 64. Still open |

## Not resolved

- I have not seen the videos' frames, only what the speakers say.
- Twitter/X gave almost nothing readable. [Aumission](https://x.com/Aumission/status/1942637035317006638) posts a breakdown on imperfections, but it would not open.
- Modelling is where I learned least: the transcripts I got cover light and shader. I have not fixed how the pump and cap are modelled.
