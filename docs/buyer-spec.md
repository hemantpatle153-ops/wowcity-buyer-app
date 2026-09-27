# WowCity buyer app: product spec

Source: `files/mobile-app.md` §11 and `files/instructions.md` (W7 display order, W10 buyer search, public read model) in the wow-city repo.

## What it is

A **discovery marketplace only**. Buyers find clothing that shops near them have in stock, save favourites, and walk into the shop to buy. There is no cart, checkout, payment or billing on the buyer side.

## Screens

| Screen | Purpose |
|---|---|
| Welcome / location | Use current location (permission asked only here), or type a city. Radius picker (1, 3, 5, 10, 25 km). Skippable sign-in. |
| Home feed | Product cards from nearby shops: newest and nearest, "in stock near you", category chips, nearby shops carousel. Pull to refresh, infinite scroll. |
| Search | Search box (matches product name, brand, category and shop tags), filter chips: category, brand, size, colour, price range, in stock only, sort (nearest, newest, price low/high). Recent searches on device. |
| Product detail | Display order is fixed: 1) photos (swipeable gallery, pinch zoom), 2) description, 3) labelled detail rows for each field the shop enabled (`Size: L`, `Colour: Navy`, `Brand: …`, custom fields like `Fabric: Cotton`), price/MRP if shown, sizes/colours with in-stock / sold-out state, 4) Save (heart) button. Shop card with distance, Directions (opens maps), Call (if the shop shares its phone), Share product. |
| Shop profile | Shop name, city, distance, address/phone/map if shared, count of items in stock, the shop's products (search within shop). |
| Nearby shops | List and map of discoverable shops within the radius. |
| Saved | Favourites (sign-in required). Sold-out items show as sold out; unlisted items drop off. |
| Account / Settings | Sign in or out (email or mobile code), name, location and radius defaults, Appearance (see design.md), notifications (later), privacy policy, **Delete account**. |

## Rules

- Show only what the API returns; a missing field means the shop hid it. Never infer or display stock counts.
- Out-of-stock products still show, clearly marked "Sold out at this shop".
- Location is used only to sort and filter; it is not stored on the server.
- Browsing works signed out. Saving favourites asks the buyer to sign in, then completes the save.
