import styled from '@emotion/styled'

export const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};
    margin-bottom: ${({ theme }) => theme.spacing(3)};

    animation: fadeIn 0.2s ease;

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    label {
        font-size: 0.9rem;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text};
    }

    input,
    select,
    textarea {
        padding: ${({ theme }) => theme.spacing(1.5)};
        border-radius: ${({ theme }) => theme.borderRadius.small};
        border: 2px solid ${({ theme }) => theme.colors.border};
        outline: none;
        font-family: inherit;
        font-size: 0.95rem;
        background-color: ${({ theme }) => theme.colors.surface};
        color: ${({ theme }) => theme.colors.text};
        transition: ${({ theme }) => theme.transitions.default};

        &:focus {
            border-color: ${({ theme }) => theme.colors.primary};
            box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.sidebarHover};
        }

        &:hover {
            border-color: ${({ theme }) => theme.colors.primary}60;
        }
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }

    @media (max-width: 768px) {
        margin-bottom: ${({ theme }) => theme.spacing(2.5)};

        input,
        select,
        textarea {
            font-size: 1rem; /* Larger for mobile */
        }
    }
`

export const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing(2)};
    margin-top: ${({ theme }) => theme.spacing(4)};

    @media (max-width: 768px) {
        flex-direction: column-reverse;
        gap: ${({ theme }) => theme.spacing(1.5)};
        margin-top: ${({ theme }) => theme.spacing(3)};
    }
`

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    font-weight: 700;
    font-size: 0.95rem;
    transition: ${({ theme }) => theme.transitions.default};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    ${({ theme, variant = 'secondary' }) => {
        if (variant === 'primary') {
            return `
                background-color: ${theme.colors.primary};
                color: white;
                &:hover { 
                    background-color: ${theme.colors.primaryHover}; 
                    transform: translateY(-1px);
                }
                &:active { transform: translateY(0); }
            `
        }
        if (variant === 'danger') {
            return `
                background-color: transparent;
                color: ${theme.colors.danger};
                border: 2px solid ${theme.colors.danger};
                &:hover { 
                    background-color: ${theme.colors.danger}; 
                    color: white; 
                }
            `
        }
        return `
            background-color: ${theme.colors.surfaceAlt};
            color: ${theme.colors.textMuted};
            border: 1px solid ${theme.colors.border};
            &:hover { 
                background-color: ${theme.colors.sidebarHover}; 
                color: ${theme.colors.text}; 
                border-color: ${theme.colors.primary}40;
            }
        `
    }}

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
    }

    @media (max-width: 768px) {
        width: 100%;
        padding: ${({ theme }) => theme.spacing(2)} ${({ theme }) => theme.spacing(3)};
    }
`
