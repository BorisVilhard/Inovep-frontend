import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../Button/Button';
import { usePathname, useRouter } from 'next/navigation';
import companyLogo from '../../../../public/img/companylogo.png';
import useStore from '@/views/auth/api/userReponse';

const Navbar = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { username, accessToken, logOut } = useStore();

  const handleLogoutClick = () => {
    router.push('/auth/login');
    logOut();
  };

  const pages = [
    { name: 'Dashboard', url: '/dashboard', protected: true },
    { name: 'Report', url: '/report', protected: true },
  ];

  return (
    <div className="relative z-50 mx-auto bg-shades-white px-4 text-shades-white">
      <div className="flex w-full items-center justify-between">
        <Image src={companyLogo} width={85} height={85} alt="company logo" />
        <nav className="ml-[15%] hidden w-full items-center justify-between lg:flex">
          {accessToken && (
            <div className="flex items-center">
              {pages
                .filter((page) => !page.protected || username)
                .map((navLink, i) => (
                  <Link href={navLink.url} key={i}>
                    <p
                      className={`${pathname === navLink.url ? 'font-medium' : ''} relative m-4 text-[1rem] font-bold tracking-[0.105em] text-shades-black`}
                    >
                      {navLink.name}
                      {pathname === navLink.url && (
                        <div className="absolute -bottom-2 left-1/2 h-[7px] w-[45px] -translate-x-1/2 rounded-[20px] bg-neutral-30" />
                      )}
                    </p>
                  </Link>
                ))}
            </div>
          )}
        </nav>

        {username ? (
          <div className="relative mr-[20px] flex w-fit items-center justify-between p-5">
            <Image
              src={'/img/profile.png'}
              width={50}
              height={50}
              alt="profile"
              className="relative z-50 rounded-full"
              onClick={() => setMenuOpen(!isMenuOpen)}
            />
            {isMenuOpen && (
              <div className="absolute right-0 top-[50px] z-50 mt-3 w-[200px] rounded-md border-2 border-solid border-gray-900 bg-gray-900 py-4 text-shades-white">
                <div className="mx-2 mb-2 flex justify-center rounded-lg bg-primary-50 p-1">
                  {username}
                </div>
                <Link href={'/profile'}>
                  <div className="mx-1 p-2 hover:bg-primary-60">Profile</div>
                </Link>
                <div onClick={handleLogoutClick} className="mx-1 p-2 hover:bg-primary-60">
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-5">
            <Button type="secondary">
              <Link href={'/auth/login'}> Login</Link>
            </Button>
            <Button type="secondary">
              <Link href={'/auth/register'}>Register</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
