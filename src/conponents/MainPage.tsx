import { NeneCalendar } from "./Calendar";

export const MainPage=()=>{
    return(
<main style={{
    position: 'relative',
    display:"inlineFlex"
  }}>
    <div style={{
          display:"flex",
          flexDirection:"row"

        }}>
    <div style={{
          display:"flex",
          flexDirection:"column"

        }}>
  <NeneCalendar/>
  </div>
  </div>
  </main>
  )}