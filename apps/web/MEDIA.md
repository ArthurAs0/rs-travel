# Media sources (design demo)

| File | Source | Status |
| --- | --- | --- |
| `public/media/hero-armenia-1920.mp4`, `hero-armenia-1280.mp4`, `hero-armenia-poster.jpg` | "Ararat Mountain" by Armen Harutyunyan, [Pexels](https://www.pexels.com/video/ararat-mountain-19906456/) (Pexels licence: free to use, credit appreciated). Re-graded, cropped, cross-faded into a 14 s loop. | Placeholder. Replace with agency footage when available. |
| `public/media/places/haghartsin-{1600,960}.mp4`, `haghartsin-poster.jpg` | "Haghartsin Monastery" by Ash Haghighi, [Pexels 18499982](https://www.pexels.com/video/haghartsin-monastery-18499982/). Fog-reveal section, 9.3 s seamless loop. | Backdrop when Haghartsin is the centred card. |
| `public/media/places/yerevan-{1600,960}.mp4`, `yerevan-poster.jpg` | "Drone shot Cascade Yerevan Armenia" by Ash Haghighi, [Pexels 16209386](https://www.pexels.com/video/drone-shot-cascade-yerevan-armenia-16209386/). 11.8 s seamless loop. | Backdrop when Yerevan is the centred card. |
| `public/images/destinations/backdrops/*.jpg` | Wide 1920 × 1200 versions of the same photos as the cards (Pexels IDs below); Tatev and Bride's Rock are wide crops of the agency's Instagram images. | Backdrops for places without footage (slow zoom). |
| `public/images/destinations/tatev-monastery.jpg` | RP Go Armenia Instagram, Tatev carousel slide 3, cropped below the caption. | Agency photo, lowish res. Request the original. |
| `public/images/destinations/brides-rock.jpg` | RP Go Armenia Instagram, Bride's Rock reel cover, rotated and cropped clear of the caption (360 px). | Low-res. Request the original. |
| `public/images/destinations/haghartsin-monastery.jpg` | Ash Haghighi, [Pexels 18500065](https://www.pexels.com/photo/18500065/) | Example (Pexels licence). |
| `public/images/destinations/dilijan.jpg` | IsaaK Alexandre KaRslian, [Pexels 29206207](https://www.pexels.com/photo/29206207/) | Example (Pexels licence). |
| `public/images/destinations/yerevan-cascade.jpg` | IsaaK Alexandre KaRslian, [Pexels 29206201](https://www.pexels.com/photo/29206201/) | Example (Pexels licence). |
| `public/images/destinations/garni-temple.jpg` | Dusan Stupar, [Pexels 34058959](https://www.pexels.com/photo/34058959/) | Example (Pexels licence). |
| `public/images/destinations/geghard-monastery.jpg` | Alexander Fadeev, [Pexels 35224032](https://www.pexels.com/photo/35224032/) | Example (Pexels licence). |
| `public/images/destinations/khor-virap.jpg` | Dusan Stupar, [Pexels 34146317](https://www.pexels.com/photo/34146317/) | Example (Pexels licence). |
| `public/images/destinations/sevanavank.jpg` | Uğurcan Özmen, [Pexels 27198846](https://www.pexels.com/photo/27198846/) | Example (Pexels licence). |
| `public/images/destinations/noravank.jpg` | Alexander Fadeev, [Pexels 35224033](https://www.pexels.com/photo/35224033/) | Example (Pexels licence). |
| `public/images/brand/rp-go-armenia-logo.jpg` | RP Go Armenia Instagram avatar (150 × 150). | Request a high-res / vector logo. |

To swap the hero clip, replace the files above (keep the names) or edit `src/lib/content/home.ts`.

Pexels photos are free to use without attribution; credits are kept here and in `src/lib/mock-data/destinations.ts` (`credit`). All destination images are 900 × 900 square crops.
