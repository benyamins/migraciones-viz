import { LineChart } from 'echarts/charts'
import { AriaComponent, GridComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'

// Register only what the charts use: `import * as echarts from 'echarts'`
// would bundle every chart type and component (~360 KB gzipped).
echarts.use([LineChart, GridComponent, TooltipComponent, AriaComponent, SVGRenderer])

export { echarts }
export type { EChartsOption, TooltipComponentFormatterCallbackParams } from 'echarts'
