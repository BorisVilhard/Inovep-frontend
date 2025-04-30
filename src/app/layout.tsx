'use client';

import '../styles/globals.css';
import '../styles/particleAnimation.scss';
import '../styles/bubbleAnimation.css';
import '../styles/loadingAnimation.css';
import '../styles/fluidupAnimation.css';

import Navbar from '@/app/components/Navbar';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const RootLayout = ({ children }: { children: ReactNode }) => {
	const currentPath = usePathname();

	return (
		<html lang='en'>
			<head />
			<body>
				{!currentPath.startsWith('/auth/') ? (
					<>
						<Navbar />
						<div className='flex flex-col items-center justify-center'>
							{children}
						</div>
					</>
				) : (
					<>{children}</>
				)}
			</body>
		</html>
	);
};

export default RootLayout;
