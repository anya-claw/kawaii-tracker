import { useState, useEffect } from 'react'
import { Modal } from './Modal'
import { Button } from './Form'
import { setErrorListener } from '../../shared/utils/errorManager'
import styled from '@emotion/styled'

const ErrorText = styled.p`
    color: ${({ theme }) => theme.colors.text};
    font-size: 1rem;
    margin-bottom: ${({ theme }) => theme.spacing(3)};
    line-height: 1.5;
`

export function ErrorModalProvider() {
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setErrorListener(setError)
        return () => setErrorListener(null)
    }, [])

    return (
        <Modal isOpen={!!error} onClose={() => setError(null)} title="Error">
            <ErrorText>{error}</ErrorText>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="danger" onClick={() => setError(null)}>
                    Dismiss
                </Button>
            </div>
        </Modal>
    )
}
