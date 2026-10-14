type CareScheduleType = 'VACCINATION' | 'MEDICATION' | 'HEARTWORM' | 'CHECKUP';

type RepeatUnit = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

type ParsedCareSchedule = {
  type: CareScheduleType;
  name: string;
  dosageText?: string;
  dueDate?: string;
  repeat?: {
    unit: RepeatUnit;
    interval: number;
  };
  notificationEnabled: boolean;
  notificationTime?: string;
};

type RequestBody = {
  text: string;
  today: string;
  timezone: string;
};

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers':
            'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          error: 'Method not allowed',
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const body = (await req.json()) as RequestBody;

    if (!body.text?.trim()) {
      return new Response(
        JSON.stringify({
          error: 'text is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const apiKey = Deno.env.get('LLM_API_KEY');

    if (!apiKey) {
      throw new Error('LLM_API_KEY is missing');
    }

    const prompt = `
너는 반려동물 관리 일정 입력 보조 시스템이다.

오늘 날짜:
${body.today}

사용자 시간대:
${body.timezone}

사용자 입력:
"${body.text}"

반드시 JSON만 반환해라.

허용 type:
- MEDICATION
- VACCINATION
- HEARTWORM
- CHECKUP

허용 repeat.unit:
- DAY
- WEEK
- MONTH
- YEAR

출력 예시:

{
  "type": "MEDICATION",
  "name": "심장약",
  "dosageText": "1정",
  "dueDate": "2026-10-14",
  "repeat": {
    "unit": "DAY",
    "interval": 1
  },
  "notificationEnabled": true,
  "notificationTime": "20:00"
}

규칙:

- "매일" → DAY / 1
- "3일마다" → DAY / 3
- "매주" → WEEK / 1
- "2주마다" → WEEK / 2
- "매달" → MONTH / 1
- "매년" → YEAR / 1

- 사용자가 말한 복용량만 dosageText에 넣는다.
- 시간이 명확하면 notificationEnabled=true
- 시간은 HH:mm 24시간 형식
- 시간이 없으면 notificationEnabled=false
- 날짜가 명확하면 YYYY-MM-DD
- 알 수 없는 값은 추측하지 않는다.
- 의료 진단은 하지 않는다.
- JSON 외 문장은 출력하지 않는다.
`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error('LLM API ERROR:', errorText);

      throw new Error('LLM request failed');
    }

    const data = await response.json();

    const outputText = data.output?.[0]?.content?.[0]?.text;

    if (!outputText) {
      throw new Error('Empty LLM response');
    }

    const parsed = JSON.parse(outputText) as ParsedCareSchedule;

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('parse-care-schedule error:', error);

    return new Response(
      JSON.stringify({
        error: '일정을 분석하지 못했어요.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
});
