import { ImageResponse } from "next/og";
export const alt = "SplitShop · Checkout playground";
export const size = {width:1200,height:630};
export const contentType = "image/png";
export const dynamic = "force-static";
export default function Image() {
  return new ImageResponse(<div style={{width:"100%",height:"100%",background:"#f5f4ef",color:"#171a21",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"72px 80px"}}>
    <div style={{display:"flex",fontSize:48,fontWeight:700,color:"#2147bc"}}>// splitshop.dev</div>
    <div style={{display:"flex",flexDirection:"column",gap:24}}><div style={{fontSize:76,fontWeight:700,letterSpacing:"-.05em"}}>Build a cart. Split the bill.</div><div style={{fontSize:28,color:"#4d5360"}}>The checkout playground. No real money moves.</div></div>
  </div>,size);
}
