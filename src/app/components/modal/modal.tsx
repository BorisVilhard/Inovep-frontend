import { animated, useChain, useSpringRef, useTransition } from '@react-spring/web';
import classNames from 'classnames';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useKey } from 'react-use';
import Button from '../Button/Button';

interface Props {
  visible: boolean;
  title: string;
  okName?: string;
  children: ReactNode;
  onClose?: () => void;
  onOk?: () => void;
}

const ANIMATION_DURATION_MS = 100;

const Modal = ({ visible, onClose, onOk, title, children }: Props) => {
  const baseModalRef = useSpringRef();
  const overlayModalRef = useSpringRef();
  const contentTransitionRef = useSpringRef();

  useKey(
    'Escape',
    () => {
      if (visible) {
        onClose?.();
      }
    },
    undefined,
    [onClose],
  );

  useEffect(() => {
    if (visible) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => document.body.classList.remove('overflow-hidden');
  }, [visible]);

  const baseModalTransition = useTransition(visible, {
    ref: baseModalRef,
    config: {
      duration: ANIMATION_DURATION_MS,
      from: { opacity: 0 },
      enter: { opacity: 1 },
      leave: { opacity: 0 },
    },
  });

  const overlayTransition = useTransition(visible, {
    ref: overlayModalRef,
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: {
      duration: ANIMATION_DURATION_MS,
    },
  });

  const contentTransition = useTransition(visible, {
    ref: contentTransitionRef,
    from: { opacity: 0, top: '-10%', transform: 'scale(0.7)' },
    enter: { opacity: 1, top: '0', transform: 'scale(1)' },
    leave: { opacity: 0, top: '10%', transform: 'scale(0.7)' },
    config: {
      duration: ANIMATION_DURATION_MS,
    },
  });

  useChain([baseModalRef, overlayModalRef, contentTransitionRef], [0, 0, 0]);

  const modal = baseModalTransition(
    (baseStyle, item) =>
      item && (
        <animated.div
          style={baseStyle}
          className="fixed inset-0 z-20 flex h-screen w-screen items-center justify-center p-10"
        >
          {overlayTransition(
            (overlayTransitionStyle, item) =>
              item && (
                <animated.div
                  className="absolute inset-0 z-0 h-full w-full bg-neutral-40 bg-opacity-50 backdrop-blur-sm"
                  style={overlayTransitionStyle}
                  onClick={onClose}
                />
              ),
          )}
          {contentTransition(
            (contentTransitionStyle, item) =>
              item && (
                <animated.div
                  style={contentTransitionStyle}
                  className={
                    'relative flex min-h-[300px] w-[600px] flex-col items-center justify-between overflow-y-auto overflow-x-hidden rounded-[32px] bg-shades-white px-20 py-10 shadow-md'
                  }
                >
                  <div className="flex flex-col items-center gap-[30px]">
                    <h1 className="text-3xl font-bold">{title}</h1>
                    {children}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="secondary" onClick={onOk}>
                      Confirm
                    </Button>
                  </div>
                </animated.div>
              ),
          )}
        </animated.div>
      ),
  );

  return createPortal(modal, document.body);
};

export default Modal;
