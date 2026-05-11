import styled from '@emotion/styled'

export const FormGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(1)};
    margin-bottom: ${({ theme }) => theme.spacing(3)};

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
        transition: ${({ theme }) => theme.transitions.default};

        &:focus {
            border-color: ${({ theme }) => theme.colors.primary};
            box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.sidebarHover};
        }
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }
`

export const ButtonGroup = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.spacing(2)};
    margin-top: ${({ theme }) => theme.spacing(4)};
`

export const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
    padding: ${({ theme }) => theme.spacing(1.5)} ${({ theme }) => theme.spacing(3)};
    border-radius: ${({ theme }) => theme.borderRadius.medium};
    font-weight: 700;
    font-size: 0.95rem;
    transition: ${({ theme }) => theme.transitions.default};

    ${({ theme, variant = 'secondary' }) => {
        if (variant === 'primary') {
            return `
                background-color: ${theme.colors.primary};
                color: white;
                &:hover { background-color: ${theme.colors.primaryHover}; }
            `
        }
        if (variant === 'danger') {
            return `
                background-color: transparent;
                color: ${theme.colors.danger};
                border: 2px solid ${theme.colors.danger};
                &:hover { background-color: ${theme.colors.danger}; color: white; }
            `
        }
        return `
            background-color: transparent;
            color: ${theme.colors.textMuted};
            &:hover { background-color: ${theme.colors.border}; color: ${theme.colors.text}; }
        `
    }}
`
