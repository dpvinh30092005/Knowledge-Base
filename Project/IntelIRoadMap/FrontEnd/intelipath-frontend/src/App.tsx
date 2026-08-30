import { AppRoutes } from "@/app/router"
import { GlobalProgressBar, GlobalToast } from "@/components/ui"

function App() {
  return (
    <>
      <GlobalProgressBar />
      <GlobalToast />
      <AppRoutes />
    </>
  )
}

export default App
