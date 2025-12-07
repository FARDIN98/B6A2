import app from './app'
import { startAutoReturnJob } from './jobs/autoReturn'

const port = 5001

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
  startAutoReturnJob()
})
