import { NextResponse } from 'next/server';
import { ALL_SYLLABUS_SECTIONS, NEC_ASOE_SYLLABUS } from '@/data/nec-asoe-syllabus';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'nec-asoe-mcq-exam',
    chapters: NEC_ASOE_SYLLABUS.length,
    sections: ALL_SYLLABUS_SECTIONS.length,
    timestamp: new Date().toISOString(),
  });
}

