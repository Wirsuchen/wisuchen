'use client'

import { useState } from 'react'
import { useTranslation } from '@/contexts/i18n-context'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

export function QuickPostWizard() {
    const { t } = useTranslation()
    const [step, setStep] = useState(1)
    const [data, setData] = useState({ title: '', category: '', description: '' })

    const handleNext = () => setStep(step + 1)
    const handleBack = () => setStep(step - 1)
    const handleSubmit = () => {
        // Simulate submission
        setTimeout(() => {
            toast({ title: t('publisher.wizard.success') })
            setStep(1)
            setData({ title: '', category: '', description: '' })
        }, 500)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('publisher.wizard.title')} - {t('publisher.wizard.step')} {step}/3</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 1 && (
                    <>
                        <div className="space-y-2">
                            <Label>{t('publisher.wizard.jobTitle')}</Label>
                            <Input
                                value={data.title}
                                onChange={e => setData({ ...data, title: e.target.value })}
                                placeholder={t('publisher.wizard.jobTitlePlaceholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('publisher.wizard.category')}</Label>
                            <Input
                                value={data.category}
                                onChange={e => setData({ ...data, category: e.target.value })}
                                placeholder={t('publisher.wizard.categoryPlaceholder')}
                            />
                        </div>
                    </>
                )}
                {step === 2 && (
                    <div className="space-y-2">
                        <Label>{t('publisher.wizard.description')}</Label>
                        <Textarea
                            value={data.description}
                            onChange={e => setData({ ...data, description: e.target.value })}
                            placeholder={t('publisher.wizard.descriptionPlaceholder')}
                            className="min-h-[150px]"
                        />
                    </div>
                )}
                {step === 3 && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-2">
                            <div className="p-4 border rounded-md bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">{t('publisher.wizard.jobTitle')}</p>
                                <p className="text-lg">{data.title || '-'}</p>
                            </div>
                            <div className="p-4 border rounded-md bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">{t('publisher.wizard.category')}</p>
                                <p className="text-lg">{data.category || '-'}</p>
                            </div>
                            <div className="p-4 border rounded-md bg-muted/50">
                                <p className="text-sm font-medium text-muted-foreground">{t('publisher.wizard.description')}</p>
                                <p className="whitespace-pre-wrap">{data.description || '-'}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between mt-6">
                    {step > 1 ? (
                        <Button variant="outline" onClick={handleBack}>{t('common.back')}</Button>
                    ) : (
                        <div></div>
                    )}

                    {step < 3 ? (
                        <Button onClick={handleNext}>{t('common.next')}</Button>
                    ) : (
                        <Button onClick={handleSubmit}>{t('common.submit')}</Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
