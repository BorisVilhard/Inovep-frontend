import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../Button/Button';
import { redirect, usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useDispatch, useSelector } from 'react-redux';
import { logOut, selectCurrentUser, setCredentials } from '@/app/redux/authSlice';
import companyLogo from '../../../../public/img/companylogo.png';

const Navbar = () => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const { data: session, status } = useSession();
  const user = useSelector(selectCurrentUser);
  if (status !== 'loading') {
    dispatch(
      setCredentials({
        username: session?.user?.name,
        image: session?.user?.image,
        email: session?.user?.email,
      }),
    );
  }

  return (
    <div className="sticky left-0 top-0 z-50 mx-auto px-4 text-shades-white">
      <div className="flex w-full items-center justify-between">
        <div>
          <Image src={companyLogo} width={85} height={85} alt="company logo" />
        </div>

        {session ? (
          <div className="relative mr-[20px] flex w-fit items-center justify-between p-5">
            <Image
              src={user?.image ? user.image : '/img/profile.png'}
              width={50}
              height={50}
              alt="profile"
              className="rounded-full"
              onClick={() => setMenuOpen(!isMenuOpen)}
            />
            {isMenuOpen && (
              <div className="absolute right-0 z-50 mt-3 w-[200px] rounded-md border-2 border-solid border-primary-60 bg-primary-70 py-4 text-shades-white">
                <div className="mx-2 mb-2 flex justify-center rounded-lg bg-primary-50 p-1">
                  {user?.username}
                </div>
                <Link href={'/profile'}>
                  <div className="mx-1 p-2 hover:bg-primary-60">Profile</div>
                </Link>
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    signOut();
                    dispatch(logOut());
                    redirect('/');
                  }}
                  className="mx-1 p-2 hover:bg-primary-60"
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-5">
            <Button type="secondary" onClick={() => signIn()}>
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
