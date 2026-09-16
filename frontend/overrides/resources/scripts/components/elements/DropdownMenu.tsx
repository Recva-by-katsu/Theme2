/**
 * Aurora Theme — DropdownMenu (same API as stock, themed presentation).
 *
 * Stock API preserved: default export class with renderToggle prop, plus the
 * named DropdownButtonRow export used by the backup context menu.
 */
import React, { createRef } from 'react';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`p-2 flex items-center rounded w-full text-sm cursor-pointer`};
    background: transparent;
    border: none;
    color: var(--aurora-text);
    transition: background var(--aurora-ms-fast), color var(--aurora-ms-fast);

    &:hover {
        color: ${(props) => (props.danger ? 'var(--aurora-danger)' : 'var(--aurora-primary)')};
        background: ${(props) => (props.danger ? 'var(--aurora-danger-soft)' : 'var(--aurora-primary-soft)')};
    }
`;

const Menu = styled.div`
    width: 12rem;
    background: var(--aurora-surface);
    border: 1px solid var(--aurora-border);
    border-radius: var(--aurora-radius-sm);
    box-shadow: var(--aurora-shadow);
    padding: 0.4rem;
    color: var(--aurora-text);
`;

interface State {
    posX: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();

    state: State = {
        posX: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(_prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;

        if (this.state.visible && !prevState.visible && menu) {
            document.addEventListener('click', this.windowListener);
            document.addEventListener('contextmenu', this.contextMenuListener);
            menu.style.left = `${Math.round(this.state.posX - menu.clientWidth)}px`;
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        this.triggerMenu(e.clientX);
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    triggerMenu = (posX: number) =>
        this.setState((s) => ({
            posX: !s.visible ? posX : s.posX,
            visible: !s.visible,
        }));

    render() {
        return (
            <div>
                {this.props.renderToggle(this.onClickHandler)}
                <Fade timeout={150} in={this.state.visible} unmountOnExit>
                    <Menu
                        ref={this.menu}
                        onClick={(e) => {
                            e.stopPropagation();
                            this.setState({ visible: false });
                        }}
                        className="absolute z-50"
                    >
                        {this.props.children}
                    </Menu>
                </Fade>
            </div>
        );
    }
}

export default DropdownMenu;
