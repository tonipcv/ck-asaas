import { NextResponse } from 'next/server';
import { ASAAS_CONFIG } from '@/config/asaas';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, customerId, creditCard, installments } = body;

    console.log('Processando cartão:', {
      paymentId,
      customerId,
      installments,
      creditCard: { ...creditCard, number: '****' }
    });

    const response = await fetch(`${ASAAS_CONFIG.BASE_URL}/payments/${paymentId}/payWithCreditCard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': '$aact_MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmMxZWYxNWVmLTE5NTItNGI4OC04NGE2LTk1NzE4ZGMzMzUxYzo6JGFhY2hfODdkMDVhNzUtNzAzOS00ZTJkLTlkNGEtNjliYTIwYzMwZDlh'
      },
      body: JSON.stringify({
        customer: customerId,
        creditCard,
        creditCardHolderInfo: {
          name: creditCard.holderName,
          email: 'email@exemplo.com',
          cpfCnpj: '00000000000',
          postalCode: '00000000',
          addressNumber: '000',
          phone: '00000000000'
        },
        installmentCount: installments,
        remoteIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao processar cartão:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Erro ao processar cartão: ${errorText}`);
    }

    const result = await response.json();
    console.log('Pagamento processado:', result);

    // Atualizar status do pagamento no banco local
    await prisma.payment.update({
      where: { asaasId: paymentId },
      data: { status: result.status }
    });

    return NextResponse.json({
      success: true,
      status: result.status
    });
  } catch (error) {
    console.error('Erro detalhado:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao processar cartão' 
    }, { status: 500 });
  }
} 