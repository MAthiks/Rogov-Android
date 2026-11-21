// ART-103C — 11 inventory sprites sharpened for compact Android displays.
// Read-only presentation layer: original Sprite C 24x24 contours remain
// authoritative; the additional markings change neither item IDs nor logic.
import {ITEM_ART_IDS,ITEM_SVGS} from "./veyr-art.js";
const pixel=(x,y,w,h,c)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
const BRONZE="#dec18a",SHADOW="#28333d",GLINT="#fbebbf",ARC="#86cfbd",IRON="#aab0a8";
const DETAILS=Object.freeze({
  "weapon.rusty_sword":
    pixel(13,8,2,1,GLINT)+pixel(7,14,1,2,"#7a5241")+pixel(5,19,1,2,BRONZE),
  "weapon.ashen_blade":
    pixel(14,8,1,2,ARC)+pixel(10,13,1,2,ARC)+pixel(6,19,2,1,GLINT)+
    pixel(16,5,1,1,GLINT),
  "weapon.bone_dagger":
    pixel(16,5,2,1,GLINT)+pixel(11,12,1,1,"#776f60")+
    pixel(8,17,1,1,GLINT),
  "weapon.iron_mace":
    pixel(14,5,3,1,IRON)+pixel(19,8,1,3,SHADOW)+
    pixel(8,16,2,1,BRONZE)+pixel(5,21,2,1,GLINT),
  "shield.worn_buckler":
    pixel(11,3,2,1,GLINT)+pixel(5,10,1,2,BRONZE)+
    pixel(18,12,1,2,BRONZE)+pixel(11,18,2,1,BRONZE),
  "armor.scavenged_cuirass":
    pixel(9,6,6,1,BRONZE)+pixel(6,10,2,1,GLINT)+
    pixel(16,10,2,1,GLINT)+pixel(10,17,4,1,SHADOW),
  "armor.broken_plate":
    pixel(6,9,2,2,BRONZE)+pixel(16,9,2,2,BRONZE)+
    pixel(12,14,2,1,"#b3685c")+pixel(8,20,3,1,IRON),
  "consumable.vigor_salts":
    pixel(8,9,2,1,GLINT)+pixel(15,10,2,1,GLINT)+
    pixel(11,15,2,1,ARC)+pixel(7,19,2,1,BRONZE),
  "consumable.bandage":
    pixel(5,13,3,1,GLINT)+pixel(10,11,3,1,GLINT)+
    pixel(15,15,3,1,GLINT)+pixel(9,19,2,1,"#8d7962"),
  "relic.ashen_fragment":
    pixel(11,4,2,2,GLINT)+pixel(16,10,2,1,BRONZE)+
    pixel(7,15,2,2,"#a4c3ae")+pixel(12,19,2,1,GLINT),
  "consumable.dusk_tonic":
    pixel(8,16,2,2,ARC)+pixel(13,19,2,1,GLINT)+
    pixel(9,7,6,1,BRONZE)+pixel(15,12,1,2,IRON)
});
export const ART103C_ITEM_IDS=ITEM_ART_IDS;
export const ITEM_SVGS_103C=Object.freeze(Object.fromEntries(
  ITEM_ART_IDS.map(id=>{
    const old=ITEM_SVGS[id],details=DETAILS[id];
    if(!old||!details)throw new Error("Unillustrated real item: "+id);
    return [id,old.replace("</svg>",'<g data-art="art103c-material-details">'+details+"</g></svg>")];
  })
));
export const ITEM_SPRITES_103C=Object.freeze(Object.fromEntries(
  ITEM_ART_IDS.map(id=>[id,"data:image/svg+xml;charset=UTF-8,"+
    encodeURIComponent(ITEM_SVGS_103C[id])])
));
// The classification ONLY affects CSS presentation. Unknown items use
// ordinary safe slots and retain the legacy text glyph in infoItem.
export const ITEM_MATERIAL_103C=Object.freeze(Object.fromEntries(
  ITEM_ART_IDS.map(id=>[id,id.split(".")[0]])
));
