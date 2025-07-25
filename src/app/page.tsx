import { Button as AntButton } from 'antd'
import { HomeOutlined, UserOutlined } from '@ant-design/icons'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          青岛市农房建设管理和乡村建设工匠培训信息平台
        </h1>

        <div className="space-y-4">
          <p className="text-lg text-gray-600">
            欢迎使用青岛市农房建设管理和乡村建设工匠培训、信用考核评价信息平台
          </p>

          <div className="flex gap-4 justify-center items-center">
            <AntButton type="primary" icon={<HomeOutlined />} size="large">
              农房管理
            </AntButton>

            <AntButton icon={<UserOutlined />} size="large">
              工匠管理
            </AntButton>

            <Button variant="outline" size="lg">
              shadcn/ui 按钮
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-2">农房信息管理</h3>
            <p className="text-gray-600">
              全面管理农房基础信息，实现数字化监管
            </p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-2">工匠培训管理</h3>
            <p className="text-gray-600">建立完整的工匠管理名录和培训体系</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow-md border">
            <h3 className="text-xl font-semibold mb-2">信用评价系统</h3>
            <p className="text-gray-600">建立动态的工匠信用评价体系</p>
          </div>
        </div>
      </div>
    </main>
  )
}
