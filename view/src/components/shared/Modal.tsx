import styled from '@emotion/styled'
import { useEffect, useRef, useState, useCallback } from 'react'

const Overlay = styled.div<{ closing: boolean }>`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({ theme }) => theme.colors.overlay};
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: ${({ closing }) => (closing ? 'fadeOut 0.2s ease forwards' : 'fadeIn 0.2s ease-out')};
    transition: background-color ${props => props.theme.transitions.slow};

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`

const ModalContainer = styled.div<{ closing: boolean }>`
    background-color: ${({ theme }) => theme.colors.surface};
    border-radius: ${({ theme }) => theme.borderRadius.large};
    box-shadow: ${({ theme }) => theme.shadows.hover};
    border: 1px solid ${({ theme }) => theme.colors.border};
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    animation: ${({ closing }) =>
        closing ? 'slideDown 0.2s ease forwards' : 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'};
    transition:
        background-color ${props => props.theme.transitions.slow},
        border-color ${props => props.theme.transitions.slow};

    @keyframes slideUp {
        from {
            transform: translateY(30px) scale(0.95);
            opacity: 0;
        }
        to {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
    }
    @keyframes slideDown {
        from {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        to {
            transform: translateY(30px) scale(0.95);
            opacity: 0;
        }
    }

    @media (max-width: 768px) {
        width: 95%;
        max-height: 85vh;
        margin-bottom: 20px;
    }
`

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${({ theme }) => theme.spacing(3)} ${({ theme }) => theme.spacing(4)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};

    h2 {
        margin: 0;
        font-size: 1.25rem;
        color: ${({ theme }) => theme.colors.text};
        font-weight: 700;
    }
`

const Content = styled.div`
    padding: ${({ theme }) => theme.spacing(4)};
    overflow-y: auto;
    color: ${({ theme }) => theme.colors.text};

    @media (max-width: 768px) {
        padding: ${({ theme }) => theme.spacing(3)};
    }
`

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const [closing, setClosing] = useState(false)
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen)

    // React-recommended pattern: derive animation state during render
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen)
        if (isOpen) {
            setClosing(false)
        } else {
            setClosing(true)
        }
    }

    const visible = isOpen || closing

    // Clean up closing state after CSS animation finishes
    const handleAnimationEnd = useCallback(
        (e: React.AnimationEvent) => {
            if (closing && e.target === overlayRef.current) {
                setClosing(false)
            }
        },
        [closing]
    )

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        if (isOpen && !closing) {
            document.addEventListener('keydown', handleEsc)
            document.body.style.overflow = 'hidden'
        }
        return () => {
            document.removeEventListener('keydown', handleEsc)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, closing, onClose])

    if (!visible) return null

    return (
        <Overlay ref={overlayRef} closing={closing} onClick={onClose} onAnimationEnd={handleAnimationEnd}>
            <ModalContainer closing={closing} onClick={e => e.stopPropagation()}>
                <Header>
                    <h2>{title}</h2>
                </Header>
                <Content>{children}</Content>
            </ModalContainer>
        </Overlay>
    )
}
