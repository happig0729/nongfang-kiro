import React from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import VillageDataEntry from '@/components/data-collection/VillageDataEntry'

interface VillageDataEntryPageProps {
  params: {
    villageCode: string
  }
}

async function getVillageInfo(villageCode: string) {
  try {
    const village = await prisma.villagePortal.findUnique({
      where: { 
        villageCode: villageCode,
        isActive: true 
      }
    })

    return village
  } catch (error) {
    console.error('Failed to fetch village info:', error)
    return null
  }
}

export default async function VillageDataEntryPage({ params }: VillageDataEntryPageProps) {
  const village = await getVillageInfo(params.villageCode)

  if (!village) {
    notFound()
  }

  return (
    <div style={{ padding: '20px', maxWidth: 1200, margin: '0 auto' }}>
      <VillageDataEntry
        villageCode={village.villageCode}
        villageName={village.villageName}
        templates={village.dataTemplates}
      />
    </div>
  )
}

export async function generateMetadata({ params }: VillageDataEntryPageProps) {
  const village = await getVillageInfo(params.villageCode)
  
  return {
    title: village ? `${village.villageName} - 数据填报` : '村庄数据填报',
    description: '青岛市农房建设管理平台 - 村庄数据填报系统',
  }
}